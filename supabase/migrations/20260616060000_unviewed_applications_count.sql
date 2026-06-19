-- 20260616060000_unviewed_applications_count.sql
-- TAREA #16b: RPC para el badge de "postulantes sin responder" del empleador.
--
-- PROBLEMA
-- --------
-- El frontend mostrará un badge en la tab "Vacantes" con el conteo de postulaciones
-- que el empleador aún no ha resuelto, a través de TODAS sus vacantes. Sin RPC, el
-- cliente tendría que traer todas las postulaciones de todas las vacantes y contar
-- en memoria.
--
-- CRITERIO
-- --------
-- Se replica el criterio "sin responder" que ya usa JobApplicantsPage:
--   estado IN ('pendiente', 'vista')
-- (NO se usa viewed_at IS NULL: la página marca como 'vista' al abrir la lista, así
--  que 'pendiente' solo nunca contaría las ya abiertas-pero-no-respondidas. El
--  estado 'vista' es la postulación abierta pero sin aceptar/rechazar.)
--
-- SEGURIDAD
-- ---------
-- SECURITY DEFINER con search_path fijo. Guard implícito por auth.uid(): solo
-- cuenta postulaciones de vacantes cuya empresa pertenece al caller
-- (companies.owner_id = auth.uid()). Excluye soft-deletes (applications.deleted_at,
-- jobs.deleted_at). REVOKE ALL FROM PUBLIC; GRANT solo a authenticated.

CREATE OR REPLACE FUNCTION public.unviewed_applications_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)
  FROM public.applications a
  JOIN public.jobs j      ON j.id = a.job_id
  JOIN public.companies c ON c.id = j.company_id
  WHERE c.owner_id = auth.uid()
    AND a.deleted_at IS NULL
    AND j.deleted_at IS NULL
    -- "Sin responder": mismo criterio que sinResponder en JobApplicantsPage.
    AND a.estado IN ('pendiente'::application_status, 'vista'::application_status);
$$;

REVOKE ALL ON FUNCTION public.unviewed_applications_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unviewed_applications_count() TO authenticated;

COMMENT ON FUNCTION public.unviewed_applications_count() IS
  'Conteo de postulaciones sin responder (estado pendiente/vista) a través de todas las vacantes del empleador autenticado (auth.uid()). Excluye soft-deletes. Para el badge de la tab Vacantes.';
