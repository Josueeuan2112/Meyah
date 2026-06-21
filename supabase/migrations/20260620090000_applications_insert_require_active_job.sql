-- 20260620090000_applications_insert_require_active_job.sql
-- M2 (MEDIO): exigir que la vacante este ACTIVA al postularse. Sin esto, un
-- candidato podia hacer POST /rest/v1/applications contra una vacante cerrada,
-- expirada o de una empresa soft-deleted.
--
-- Policy original (verificada con pg_policy), FOR INSERT TO authenticated:
--   WITH CHECK (
--     auth.uid() = candidato_id
--     AND EXISTS (SELECT 1 FROM profiles
--                 WHERE profiles.id = auth.uid() AND profiles.tipo = 'candidato')
--   )
--
-- Se PRESERVAN ambas condiciones y se AGREGA la exigencia de vacante abierta,
-- no expirada, no soft-deleted, de empresa no soft-deleted.

drop policy if exists applications_insert_own on public.applications;

create policy applications_insert_own on public.applications
  for insert to authenticated
  with check (
    auth.uid() = candidato_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.tipo = 'candidato'
    )
    and exists (
      select 1
      from public.jobs j
      join public.companies c on c.id = j.company_id
      where j.id = job_id
        and j.estado = 'abierta'
        and j.expires_at > now()
        and j.deleted_at is null
        and c.deleted_at is null
    )
  );
