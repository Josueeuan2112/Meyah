-- 20260614170000_profile_reskin_fields.sql
-- Add bio and profesion columns to profiles for the profile re-skin.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT CHECK (bio IS NULL OR char_length(bio) BETWEEN 1 AND 240),
  ADD COLUMN IF NOT EXISTS profesion TEXT CHECK (profesion IS NULL OR char_length(profesion) BETWEEN 1 AND 100);

COMMENT ON COLUMN public.profiles.bio IS 'Biografía corta del usuario, máximo 240 caracteres.';
COMMENT ON COLUMN public.profiles.profesion IS 'Profesión u oficio del usuario (candidato) o cargo (empleador).';
