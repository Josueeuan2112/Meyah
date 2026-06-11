-- Por cada vacante del empleador, cuántas postulaciones vienen de un candidato
-- a <= p_max_m metros de la vacante. SECURITY INVOKER: la RLS de applications
-- (involved) limita el conteo a las vacantes del dueño. Excluye sin ubicación.
create or replace function public.my_jobs_applicant_proximity(p_max_m double precision default 3000)
returns table (job_id uuid, cercanos bigint)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select a.job_id, count(*)::bigint as cercanos
  from applications a
  join jobs j on j.id = a.job_id
  join profiles p on p.id = a.candidato_id
  where a.deleted_at is null
    and j.location is not null
    and p.lat_referencia is not null and p.lng_referencia is not null
    and st_distance(j.location, st_setsrid(st_makepoint(p.lng_referencia, p.lat_referencia), 4326)::geography) <= p_max_m
  group by a.job_id;
$$;

grant execute on function public.my_jobs_applicant_proximity(double precision) to authenticated;
