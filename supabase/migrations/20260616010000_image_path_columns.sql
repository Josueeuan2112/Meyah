-- Feature: subida de imagenes (avatares de usuario y logos de empresa) - Fase 1
-- Columnas para guardar el PATH del objeto en Storage (no la URL completa).
--
-- Guardamos el path (ej. "avatars/{user_id}/avatar.webp") y NO la URL publica
-- completa porque:
--   - Da flexibilidad para generar URLs firmadas en el futuro sin migrar datos
--     (si algun bucket pasara a privado).
--   - Si cambia el dominio/CDN de Storage, la URL se reconstruye en el cliente
--     a partir del path; el path persistido sigue siendo valido.
--
-- IMPORTANTE: profiles.avatar_url y companies.logo_url YA EXISTEN y NO se tocan.
-- Estas columnas *_path son nuevas y coexisten con las *_url previas.

-- Avatar del usuario: path en el bucket 'avatars'.
ALTER TABLE public.profiles
  ADD COLUMN avatar_path text;

COMMENT ON COLUMN public.profiles.avatar_path IS
  'Path del avatar en Storage (bucket avatars), ej. avatars/{user_id}/avatar.webp. NULL = sin avatar. Guardamos path, no URL, para soportar URLs firmadas futuras.';

-- Logo de la empresa: path en el bucket 'company-logos'.
ALTER TABLE public.companies
  ADD COLUMN logo_path text;

COMMENT ON COLUMN public.companies.logo_path IS
  'Path del logo en Storage (bucket company-logos), ej. company-logos/{company_id}/logo.webp. NULL = sin logo. Guardamos path, no URL, para soportar URLs firmadas futuras.';
