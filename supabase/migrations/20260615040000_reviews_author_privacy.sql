-- 20260615040000_reviews_author_privacy.sql
--
-- S4: reviews expone author_id a todos los autenticados.
--
-- PROBLEMA
-- --------
-- La policy reviews_select_authenticated USING (true) deja que cualquier usuario
-- autenticado lea TODAS las filas de reviews, incluido author_id. Eso permite
-- correlacionar quien califico a quien (de-anonimizacion).
--
-- COMO CONSUME EL FRONTEND LAS REVIEWS (verificado)
-- -------------------------------------------------
--   * useCompanyRating  -> RPC company_rating (solo agregado: promedio + conteo).
--   * useMyReviewForApplication -> from('reviews').select('id,rating,comment')
--                                  .eq('author_id', userId)  (SUS PROPIAS reviews).
--   * useCreateReview   -> INSERT (no lectura cruzada).
-- NO existe ninguna pantalla que liste comentarios publicos de otros con su
-- author_id. Por lo tanto basta con endurecer la policy a author_id = auth.uid()
-- y servir el agregado por RPC DEFINER.
--
-- FIX
-- ---
--   1. Reemplazar reviews_select_authenticated (USING true) por una policy que
--      solo permite leer las reviews PROPIAS (author_id = auth.uid()).
--   2. Convertir company_rating() a SECURITY DEFINER para que el agregado
--      (promedio + conteo) siga calculandose sobre TODAS las reviews de la
--      empresa, sin exponer filas individuales. Devuelve solo numeros agregados,
--      nunca author_id.
--
-- Return shape de company_rating sin cambios -> gen:types no cambia.
-- La tabla reviews no cambia de forma.


-- ============================================================
-- 1. Endurecer la policy SELECT de reviews
-- ============================================================
-- Cada usuario solo lee sus propias reviews (lo unico que el frontend necesita
-- leer directamente: useMyReviewForApplication ya filtra por author_id).

DROP POLICY IF EXISTS "reviews_select_authenticated" ON public.reviews;

CREATE POLICY "reviews_select_own"
  ON public.reviews FOR SELECT TO authenticated
  USING (author_id = auth.uid());

-- Moderacion: los administradores conservan SELECT sobre todas las reviews para
-- poder leer el contenido de una review reportada antes de borrarla (existe la
-- policy de DELETE de reviews abusivas). Sin esto, la moderacion seria a ciegas.
-- Mismo patron de admin usado en el resto del proyecto: public.admins.
CREATE POLICY "reviews_select_admins"
  ON public.reviews FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins));


-- ============================================================
-- 2. company_rating(): INVOKER -> DEFINER
-- ============================================================
-- Antes era INVOKER y dependia de la policy ancha (USING true) para promediar
-- todas las reviews. Tras endurecer la policy, un INVOKER solo veria las reviews
-- propias y el agregado quedaria mal. Como DEFINER bypasa RLS y agrega sobre
-- todas las reviews de la empresa, pero SOLO devuelve numeros (promedio + conteo),
-- nunca author_id ni filas individuales. Mismo return shape exacto.

CREATE OR REPLACE FUNCTION public.company_rating(p_company_id uuid)
RETURNS TABLE (average_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    round(avg(r.rating)::numeric, 1) AS average_rating,
    count(*)                          AS review_count
  FROM public.reviews r
  WHERE r.company_id = p_company_id;
$$;

REVOKE EXECUTE ON FUNCTION public.company_rating(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_rating(uuid) TO authenticated;
