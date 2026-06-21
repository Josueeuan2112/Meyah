-- 20260620010000_profiles_is_searchable_immutability.sql
-- A1 (ALTO): is_searchable (DEFAULT FALSE, feature v3 sin UI) es PATCH-eable por
-- el dueno del perfil porque la RLS protege FILAS, no COLUMNAS.
--
-- Extendemos el trigger BEFORE UPDATE existente (prevent_profile_tipo_change)
-- para que un no-admin tampoco pueda cambiar is_searchable. Queda congelado en
-- su valor actual hasta que exista el flujo controlado de v3.
--
-- Definicion original (verificada con pg_get_functiondef):
--   begin
--     if new.tipo is distinct from old.tipo then
--       raise exception 'profiles.tipo is immutable';
--     end if;
--     return new;
--   end;
--
-- No rompe el update normal de perfil (nombre, bio, profesion, lat/lng_referencia,
-- radio_busqueda_km, phone, avatar_path, etc.): esos campos no se tocan aqui.

create or replace function public.prevent_profile_tipo_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_admin boolean := auth.uid() in (select user_id from public.admins);
begin
  if new.tipo is distinct from old.tipo then
    raise exception 'profiles.tipo is immutable';
  end if;

  -- is_searchable es feature v3 sin UI: solo el sistema/admin puede cambiarlo.
  if not is_admin and new.is_searchable is distinct from old.is_searchable then
    raise exception 'profiles.is_searchable solo lo maneja el sistema/admin (feature v3)';
  end if;

  return new;
end;
$$;
