-- jobs_near: agrega lat/lng de cada vacante para poder ubicarlas en el mapa.
-- ST_X = longitud, ST_Y = latitud (orden invertido respecto a como solemos
-- hablar de "lat,lng"). Quedan null cuando j.location es null, igual que
-- distancia_m. No se toca ningún otro filtro/orden de la función original.
-- Se requiere drop porque Postgres no permite cambiar las columnas de un
-- RETURNS TABLE con CREATE OR REPLACE.

drop function if exists public.jobs_near(double precision, double precision);

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
  select id, titulo, salario_min, salario_max, categoria, company_nombre, distancia_m, lat, lng
  from base
  order by distancia_m asc nulls last, created_at desc;
$$;

grant execute on function public.jobs_near(double precision, double precision) to authenticated;
