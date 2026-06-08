-- jobs_near: vacantes abiertas y vigentes con su distancia (en metros) desde el
-- punto de referencia del candidato, de la más cercana a la más lejana. Una sola
-- función cubre los dos casos: con p_lat/p_lng ordena por distancia; con null
-- (candidato sin ubicación) la distancia es null en todas y NULLS LAST cae a
-- "más recientes primero". SECURITY INVOKER: aplica la RLS de jobs (el candidato
-- ve las abiertas vía jobs_select_public_open). OJO: ST_MakePoint recibe (lng, lat).
-- MVP ordena por ST_Distance computado; el operador <-> con índice GIST es
-- optimización posterior cuando crezca el volumen.

create or replace function public.jobs_near(
  p_lat double precision default null,
  p_lng double precision default null
)
returns table (
  id uuid,
  titulo text,
  salario_min integer,
  salario_max integer,
  categoria text,
  company_nombre text,
  distancia_m double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with base as (
    select
      j.id,
      j.titulo,
      j.salario_min,
      j.salario_max,
      j.categoria,
      c.nombre as company_nombre,
      j.created_at,
      case
        when p_lat is not null and p_lng is not null and j.location is not null
        then st_distance(j.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography)
        else null
      end as distancia_m
    from jobs j
    join companies c on c.id = j.company_id
    where j.estado = 'abierta'::job_status
      and j.deleted_at is null
      and j.expires_at > now()
  )
  select id, titulo, salario_min, salario_max, categoria, company_nombre, distancia_m
  from base
  order by distancia_m asc nulls last, created_at desc;
$$;

grant execute on function public.jobs_near(double precision, double precision) to authenticated;