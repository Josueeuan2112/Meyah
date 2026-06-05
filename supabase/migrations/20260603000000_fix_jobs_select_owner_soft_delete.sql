-- ============================================================
-- FIX RLS: jobs_select_owner debe permitir al dueño ver sus
-- vacantes soft-deleted (deleted_at IS NOT NULL).
-- ============================================================
-- PROBLEMA QUE RESUELVE:
-- El soft-delete de una vacante (UPDATE jobs SET deleted_at = now())
-- fallaba con "new row violates row-level security policy for table jobs".
--
-- CAUSA: al hacer el UPDATE, Postgres evalúa la visibilidad de la fila
-- RESULTANTE bajo las policies SELECT. La versión original de
-- jobs_select_owner exigía (deleted_at IS NULL), por lo que una fila con
-- deleted_at poblado dejaba de ser visible para su propio dueño, y el
-- motor reportaba el UPDATE como violación de RLS.
--
-- SOLUCIÓN: el dueño ve TODAS sus vacantes a nivel RLS (borradas o no).
-- El ocultamiento de las borradas es responsabilidad de la QUERY del
-- cliente (useMyJobs filtra .is('deleted_at', null)), no de la policy.
-- Principio: autorización (policy) != presentación (query).
--
-- NOTA: jobs_select_public_open NO se modifica. El público/anónimo sigue
-- viendo solo vacantes con deleted_at IS NULL AND estado = 'abierta',
-- por lo que esta relajación NO expone vacantes borradas a terceros:
-- jobs_select_owner nunca aplica a quien no es el dueño.
-- ============================================================

DROP POLICY "jobs_select_owner" ON public.jobs;

CREATE POLICY "jobs_select_owner"
  ON public.jobs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = jobs.company_id
        AND c.owner_id = auth.uid()
    )
  );