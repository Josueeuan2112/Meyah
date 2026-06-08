-- 20260608010000_fix_applications_select_involved_soft_delete.sql
-- applications_select_involved todavía exige (deleted_at IS NULL), lo que hace
-- que el soft-delete deje la fila invisible y truene con "new row violates RLS".
-- Mismo patrón y arreglo que jobs_select_owner: la policy autoriza por
-- involucramiento (candidato o dueño de la vacante); ocultar las borradas es
-- responsabilidad del query del cliente, no de la policy.
-- No expone nada: la fila borrada sigue visible SOLO para el candidato dueño
-- y el empleador dueño de la vacante; anon queda fuera (TO authenticated).

drop policy "applications_select_involved" on public.applications;

create policy "applications_select_involved"
  on public.applications for select to authenticated
  using (
    (auth.uid() = candidato_id)
    or exists (
      select 1
      from jobs j
      join companies c on c.id = j.company_id
      where j.id = applications.job_id
        and c.owner_id = auth.uid()
    )
  );