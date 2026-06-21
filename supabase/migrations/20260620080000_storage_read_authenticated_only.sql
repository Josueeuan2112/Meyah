-- 20260620080000_storage_read_authenticated_only.sql
-- Escala/superficie: las policies "Public read avatars" / "Public read company
-- logos" (20260616000000) daban SELECT en storage.objects a 'anon', lo que le
-- permite .list() y ENUMERAR paths (la primera carpeta = user_id / company_id).
--
-- Como ambos buckets son public=true, el BINARIO se sirve por el CDN de Storage
-- SIN pasar por RLS, asi que el <img src> sigue funcionando para todos
-- (incluido anon) sin necesidad de esta policy SELECT. Por tanto, restringir el
-- SELECT a 'authenticated' NO rompe el display y elimina la enumeracion anonima
-- de identificadores.
--
-- Definicion original (verificada con pg_policy):
--   FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars')
--   FOR SELECT TO anon, authenticated USING (bucket_id = 'company-logos')

drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Public read company logos" on storage.objects;

-- Solo usuarios autenticados pueden listar/leer estos objetos via PostgREST/SQL.
-- El display publico de las imagenes sigue cubierto por el flag public del bucket
-- (CDN), no por esta policy.
create policy "Authenticated read avatars" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');

create policy "Authenticated read company logos" on storage.objects
  for select to authenticated
  using (bucket_id = 'company-logos');
