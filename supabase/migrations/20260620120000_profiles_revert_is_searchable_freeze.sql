-- 20260620120000_profiles_revert_is_searchable_freeze.sql
-- REVIERTE el freeze de is_searchable introducido en
-- 20260620010000_profiles_is_searchable_immutability.sql (FALSO POSITIVO).
--
-- Motivo: is_searchable NO es feature v3 sin UI. Es una feature MVP controlada
-- por el candidato: hay un checkbox "aparecer en busquedas" en
-- EditProfileDrawer.tsx / ProfileForm.tsx, y useUpdateProfile.ts envia
-- is_searchable en su .update(). Con el freeze, al togglear el checkbox y
-- guardar, el trigger lanzaba excepcion y fallaba TODO el guardado de perfil
-- (reproducido: UPDATE profiles SET is_searchable=true -> P0001
-- "profiles.is_searchable solo lo maneja el sistema/admin (feature v3)").
--
-- Definicion vigente recuperada con pg_get_functiondef (20260620010000):
--   declare
--     is_admin boolean := auth.uid() in (select user_id from public.admins);
--   begin
--     if new.tipo is distinct from old.tipo then
--       raise exception 'profiles.tipo is immutable';
--     end if;
--     if not is_admin and new.is_searchable is distinct from old.is_searchable then
--       raise exception 'profiles.is_searchable solo lo maneja el sistema/admin (feature v3)';
--     end if;
--     return new;
--   end;
--
-- Se elimina UNICAMENTE la clausula de is_searchable, preservando la de tipo
-- (que sigue siendo inmutable) y el resto exacto de la firma del trigger.
-- Como ya no se usa la variable is_admin, se retira tambien su declaracion.

create or replace function public.prevent_profile_tipo_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tipo is distinct from old.tipo then
    raise exception 'profiles.tipo is immutable';
  end if;

  return new;
end;
$$;
