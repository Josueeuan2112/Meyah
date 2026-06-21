-- 20260620070000_updated_at_skip_noop.sql
-- BAJO: update_updated_at_column bumpeaba updated_at en TODA fila, incluso si el
-- UPDATE no cambiaba nada (NEW = OLD). Eso invalida cache (TanStack Query usa
-- updated_at en algunas keys/orden) sin necesidad.
--
-- Definicion original (verificada con pg_get_functiondef):
--   BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
--   END;
--
-- Cambio: solo bumpear cuando hay un cambio real de contenido. Seguro para
-- todas las tablas que la usan (profiles, jobs, applications, ...): el unico
-- efecto es que un UPDATE no-op deja de tocar updated_at.
--
-- Se anade set search_path = '' por hardening (la funcion no referencia objetos
-- de esquema, asi que vaciar el search_path es seguro y elimina la advertencia
-- de "function with mutable search_path").

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new is distinct from old then
    new.updated_at = now();
  end if;
  return new;
end;
$$;
