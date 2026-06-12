-- P4 (valor de producto): "X candidatos viven a menos de 3 km de este punto"
-- en el form de publicación — refuerza la propuesta de valor al empleador en
-- el momento de publicar.
--
-- SECURITY DEFINER deliberado: la RLS de profiles no deja a un empleador leer
-- perfiles ajenos (correcto), pero aquí solo se devuelve un AGREGADO (count),
-- cero PII. Respeta is_searchable: solo cuenta candidatos que aceptaron
-- aparecer en búsquedas de empleadores. search_path fijo (regla DEFINER).

create or replace function public.candidates_near_count(
  p_lat double precision,
  p_lng double precision,
  p_max_m double precision default 3000
)
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
  select count(*)::integer
  from profiles p
  where p.tipo = 'candidato'::user_type
    and p.is_searchable
    and p.lat_referencia is not null
    and p.lng_referencia is not null
    and st_dwithin(
      st_setsrid(st_makepoint(p.lng_referencia, p.lat_referencia), 4326)::geography,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_max_m
    );
$$;

-- Grant mínimo: solo usuarios autenticados (devuelve solo un entero)
revoke execute on function public.candidates_near_count(double precision, double precision, double precision) from public, anon;
grant execute on function public.candidates_near_count(double precision, double precision, double precision) to authenticated;
