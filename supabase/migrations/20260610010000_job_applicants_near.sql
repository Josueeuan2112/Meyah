-- Postulantes de una vacante con su distancia (m) desde el domicilio de
-- referencia del candidato hasta la vacante. SECURITY INVOKER: la RLS filtra
-- (applications_select_involved + profiles_select_applicants + dueño del job),
-- así solo el empleador dueño obtiene a sus postulantes. lng antes que lat.
create or replace function public.job_applicants_near(p_job_id uuid)
returns table (
  id uuid,
  estado application_status,
  mensaje text,
  created_at timestamptz,
  viewed_at timestamptz,
  candidato_nombre text,
  candidato_phone text,
  distancia_m double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with base as (
    select
      a.id,
      a.estado,
      a.mensaje,
      a.created_at,
      a.viewed_at,
      p.nombre as candidato_nombre,
      p.phone  as candidato_phone,
      case
        when j.location is not null and p.lat_referencia is not null and p.lng_referencia is not null
        then st_distance(j.location, st_setsrid(st_makepoint(p.lng_referencia, p.lat_referencia), 4326)::geography)
        else null
      end as distancia_m
    from applications a
    join jobs j on j.id = a.job_id
    join profiles p on p.id = a.candidato_id
    where a.job_id = p_job_id
      and a.deleted_at is null
  )
  select id, estado, mensaje, created_at, viewed_at, candidato_nombre, candidato_phone, distancia_m
  from base
  order by distancia_m asc nulls last, created_at desc;
$$;

grant execute on function public.job_applicants_near(uuid) to authenticated;
