-- 20260615061000_company_follows.sql
-- V2 — Seguir empresa (follow). El candidato sigue empresas para recibir su
-- actividad. El CONTEO de seguidores es público (número), pero QUIÉN sigue a
-- quién NO se expone públicamente.
--
-- gen:types CAMBIA (nueva tabla company_follows + RPC company_followers_count).

-- ============================================================
-- 1. TABLA: company_follows
-- ============================================================
CREATE TABLE public.company_follows (
  company_id   uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidato_id uuid        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_company_follows PRIMARY KEY (company_id, candidato_id)
);

-- Conteo eficiente de seguidores por empresa.
CREATE INDEX idx_company_follows_company ON public.company_follows(company_id);

ALTER TABLE public.company_follows ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.company_follows IS 'Relación candidato→empresa (follow). Privado: solo el propio candidato lee sus filas. El conteo agregado se expone vía company_followers_count().';

-- ============================================================
-- 2. RLS — restrictivo
-- ============================================================
-- SELECT: el candidato SOLO lee sus propias filas (para saber si ya sigue a una
-- empresa). NO se expone públicamente quién sigue a quién. El owner de la
-- empresa tampoco ve la lista nominal de seguidores aquí (solo el número, vía
-- el RPC agregado). Decisión restrictiva intencional.
CREATE POLICY "company_follows_select_own"
  ON public.company_follows FOR SELECT TO authenticated
  USING (auth.uid() = candidato_id);

-- INSERT: el candidato inserta SOLO su propia fila, y debe ser perfil tipo
-- 'candidato' (mismo patrón que applications_insert_own). La empresa debe
-- existir y no estar borrada.
CREATE POLICY "company_follows_insert_own"
  ON public.company_follows FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = candidato_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'candidato'
    )
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id
        AND c.deleted_at IS NULL
    )
  );

-- DELETE: el candidato borra SOLO su propia fila (dejar de seguir).
CREATE POLICY "company_follows_delete_own"
  ON public.company_follows FOR DELETE TO authenticated
  USING (auth.uid() = candidato_id);

-- (No hay policy de UPDATE: la fila es inmutable; dejar de seguir = DELETE.)

-- ============================================================
-- 3. RPC: company_followers_count(p_company_id) -> int (número público)
-- ============================================================
-- SECURITY DEFINER porque la RLS de company_follows impide que un tercero lea
-- filas ajenas; necesitamos contar TODAS las filas de la empresa sin exponer
-- ninguna identidad. Devuelve solo un entero agregado -> seguro de exponer a
-- anon + authenticated.
CREATE OR REPLACE FUNCTION public.company_followers_count(p_company_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT count(*)::int
  FROM public.company_follows
  WHERE company_id = p_company_id;
$$;

COMMENT ON FUNCTION public.company_followers_count(uuid) IS 'Número público de seguidores de una empresa. DEFINER: cuenta todas las filas sin exponer identidades (la RLS de company_follows las oculta). Devuelve solo un entero agregado.';

REVOKE EXECUTE ON FUNCTION public.company_followers_count(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.company_followers_count(uuid) TO anon, authenticated;
