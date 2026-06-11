-- Contador de vistas: el candidato no tiene UPDATE en jobs (RLS), así que
-- incrementamos con SECURITY DEFINER. search_path vacío + nombres calificados.
create or replace function public.increment_job_views(p_job_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.jobs
  set views_count = coalesce(views_count, 0) + 1
  where id = p_job_id and deleted_at is null;
$$;

revoke all on function public.increment_job_views(uuid) from public;
grant execute on function public.increment_job_views(uuid) to authenticated;

-- applications_count: contador denormalizado redundante (usamos el conteo vivo
-- vía la relación applications(count)). Se elimina para no confundir.
alter table public.jobs drop column if exists applications_count;
