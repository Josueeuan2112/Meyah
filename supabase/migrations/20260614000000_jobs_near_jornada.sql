-- jobs_near: agrega jornada al RETURNS TABLE para habilitar filtro client-side
-- de tipo de jornada en el feed. DROP necesario porque Postgres no permite
-- cambiar columnas de un RETURNS TABLE con CREATE OR REPLACE.

drop function if exists public.jobs_near(double precision, double precision, double precision);

create or replace function public.jobs_near(
  p_lat double precision default null,
  p_lng double precision default null,
  p_max_m double precision default null
)
returns table (
  id uuid,
  titulo text,
  salario_min integer,
  salario_max integer,
  categoria text,
  jornada job_schedule,
  company_nombre text,
  distancia_m double precision,
  lat double precision,
  lng double precision
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
      j.jornada,
      c.nombre as company_nombre,
      j.created_at,
      case
        when p_lat is not null and p_lng is not null and j.location is not null
        then st_distance(j.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography)
        else null
      end as distancia_m,
      st_y(j.location::geometry) as lat,
      st_x(j.location::geometry) as lng
    from jobs j
    join companies c on c.id = j.company_id
    where j.estado = 'abierta'::job_status
      and j.deleted_at is null
      and j.expires_at > now()
  )
  select id, titulo, salario_min, salario_max, categoria, jornada, company_nombre, distancia_m, lat, lng
  from base
  where p_max_m is null or distancia_m is null or distancia_m <= p_max_m
  order by distancia_m asc nulls last, created_at desc;
$$;

revoke execute on function public.jobs_near(double precision, double precision, double precision) from public;
grant execute on function public.jobs_near(double precision, double precision, double precision) to anon, authenticated;
