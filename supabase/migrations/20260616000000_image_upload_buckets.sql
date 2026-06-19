-- Feature: subida de imagenes (avatares de usuario y logos de empresa) - Fase 1
-- Crea dos buckets publicos de Storage y la RLS de storage.objects que los protege.
--
-- Convenio de path (la PRIMERA carpeta = id del dueno):
--   avatars/{user_id}/avatar.webp        -> user_id = auth.uid()
--   company-logos/{company_id}/logo.webp -> company_id de una empresa cuyo owner_id = auth.uid()

-- =====================================================================
-- 1. Buckets (idempotente: reaplica limites si el bucket ya existiera)
-- =====================================================================
-- Ambos publicos para lectura directa (avatares/logos no son PII sensible).
-- 2 MB y solo formatos de imagen comprimida.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================================
-- 2. RLS de storage.objects
-- =====================================================================
-- storage.objects ya tiene RLS habilitado por defecto en Supabase.
-- Las subidas usan upsert: true, por lo que se requieren AMBAS policies
-- INSERT y UPDATE (upsert hace INSERT y, si ya existe el objeto, UPDATE).

-- ---------------------------------------------------------------------
-- 2.a SELECT (lectura) - explicito por bucket.
-- ---------------------------------------------------------------------
-- Aunque los buckets son publicos (la API de objetos publicos sirve la
-- lectura sin pasar por RLS), declaramos policies SELECT explicitas para
-- 'anon' y 'authenticated' de modo que las queries via PostgREST/SQL
-- tambien puedan listar/leer estos objetos sin depender solo del flag
-- public del bucket. Acotadas por bucket_id para no exponer otros buckets.

CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Public read company logos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'company-logos');

-- ---------------------------------------------------------------------
-- 2.b avatars: INSERT / UPDATE / DELETE solo el dueno del path.
-- ---------------------------------------------------------------------
-- La primera carpeta del path debe ser el propio auth.uid().

CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------
-- 2.c company-logos: INSERT / UPDATE / DELETE solo el dueno de la empresa.
-- ---------------------------------------------------------------------
-- La primera carpeta del path debe ser el id de una empresa cuyo
-- owner_id = auth.uid(). Esto impide que un empleador suba/altere el
-- logo de OTRA empresa. Se exige deleted_at IS NULL para que no se pueda
-- operar sobre logos de empresas eliminadas (soft-delete).

CREATE POLICY "Owners upload own company logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT c.id::text
        FROM public.companies c
       WHERE c.owner_id = auth.uid()
         AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "Owners update own company logo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT c.id::text
        FROM public.companies c
       WHERE c.owner_id = auth.uid()
         AND c.deleted_at IS NULL
    )
  )
  WITH CHECK (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT c.id::text
        FROM public.companies c
       WHERE c.owner_id = auth.uid()
         AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "Owners delete own company logo" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT c.id::text
        FROM public.companies c
       WHERE c.owner_id = auth.uid()
         AND c.deleted_at IS NULL
    )
  );
