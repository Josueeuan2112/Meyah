-- P1 (valor de producto): el registro captura radio_busqueda_km pero el feed
-- no lo usaba — el onboarding prometía relevancia que no se entregaba.
-- jobs_near gana p_max_m (metros, opcional): con valor, excluye vacantes MÁS
-- LEJOS del radio; las vacantes sin ubicación (distancia null) se conservan,
-- igual que el comportamiento con p_max_m null (sin filtro, retrocompatible).
--
-- DROP necesario: agregar un parámetro crearía un OVERLOAD (2 args y 3 args
-- conviviendo) y PostgREST fallaría por ambigüedad al resolver la RPC.

drop function if exists public.jobs_near(double precision, double precision);

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
  where p_max_m is null or distancia_m is null or distancia_m <= p_max_m
  order by distancia_m asc nulls last, created_at desc;
$$;

-- Mismo criterio de grants que function_hardening: anon explícito e intencional
revoke execute on function public.jobs_near(double precision, double precision, double precision) from public;
grant execute on function public.jobs_near(double precision, double precision, double precision) to anon, authenticated;
