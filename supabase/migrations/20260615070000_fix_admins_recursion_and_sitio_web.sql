-- 20260615070000_fix_admins_recursion_and_sitio_web.sql
--
-- Dos correcciones de seguridad detectadas en la auditoría del perfil de empresa:
--
-- (1) CRÍTICO — Recursión infinita en la policy admins_select_self.
--     La policy SELECT de `admins` se referenciaba a sí misma con un subquery
--     sobre `admins`, así que CUALQUIER policy que consultara `admins`
--     (p. ej. "Admins verify companies" en companies, las de reportes/reviews)
--     disparaba 42P17 "infinite recursion detected in policy for relation
--     admins". En la práctica esto rompía TODO UPDATE sobre companies — el
--     editor de perfil de empresa quedaba no funcional. La feature de perfil de
--     empresa es la primera en depender intensivamente de UPDATE companies y por
--     eso destapa el bug (pre-existente desde 20260614130000).
--
--     Fix: reescribir admins_select_self SIN subquery autoreferencial. La nueva
--     condición (user_id = auth.uid()) preserva la semántica usada por todas las
--     comprobaciones de admin del proyecto —`auth.uid() IN (SELECT user_id FROM
--     admins)` devuelve la fila del caller iff es admin— y elimina la recursión
--     en su origen, arreglando todas las policies dependientes sin tocarlas.
--
-- (2) ALTO — Stored XSS vía companies.sitio_web (javascript:/data: URIs).
--     z.string().url() acepta `javascript:alert(1)`. El perfil público lo
--     renderiza en <a href>. Defensa en profundidad a nivel de datos: saneamos
--     valores existentes no-http(s) y agregamos un CHECK. (El saneo de render y
--     de Zod va en el frontend; el cliente no es frontera de confianza.)

-- ============================================================
-- (1) Romper la recursión de admins_select_self
-- ============================================================

DROP POLICY IF EXISTS "admins_select_self" ON public.admins;

CREATE POLICY "admins_select_self"
  ON public.admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

COMMENT ON POLICY "admins_select_self" ON public.admins IS
  'Cada usuario lee únicamente su propia fila de admin. Sin subquery '
  'autoreferencial: evita la recursión 42P17 que rompía las policies que '
  'consultan admins (UPDATE companies, lectura de reportes/reviews).';

-- ============================================================
-- (2) Sanear + restringir companies.sitio_web a http(s)
-- ============================================================

-- Neutraliza cualquier valor previo no-http(s) (p. ej. javascript:) antes de
-- aplicar el CHECK, para que la restricción no falle por datos existentes.
UPDATE public.companies
SET sitio_web = NULL
WHERE sitio_web IS NOT NULL
  AND sitio_web !~* '^https?://';

ALTER TABLE public.companies
  ADD CONSTRAINT companies_sitio_web_scheme_check
  CHECK (sitio_web IS NULL OR sitio_web ~* '^https?://');
