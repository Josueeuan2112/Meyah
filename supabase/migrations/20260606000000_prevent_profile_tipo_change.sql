-- profiles_update_own only checks id = auth.uid(), and RLS is not
-- column-level, so an authenticated user could PATCH their own row to set
-- tipo = 'empleador' (privilege escalation) using the public anon key plus
-- their JWT. Enforce tipo immutability at the database level.

create or replace function public.prevent_profile_tipo_change()
returns trigger
language plpgsql
as $$
begin
  if new.tipo is distinct from old.tipo then
    raise exception 'profiles.tipo is immutable';
  end if;
  return new;
end;
$$;

create trigger prevent_profile_tipo_change
before update on profiles
for each row
execute function public.prevent_profile_tipo_change();
