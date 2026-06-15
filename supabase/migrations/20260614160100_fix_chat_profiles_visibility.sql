-- 20260614160100_fix_chat_profiles_visibility.sql
-- Fix: candidates cannot see conversations because my_conversations() JOINs
-- on profiles (employer profile) which the candidate has no SELECT access to.
--
-- Root cause: profiles only has two SELECT policies:
--   1. profiles_select_own — user reads their own profile
--   2. profiles_select_applicants — employer reads applicant profiles
-- Neither allows a candidate to read the employer's profile, so the JOIN
-- in my_conversations() returns zero rows for candidates.
--
-- Fix: add a SELECT policy that lets conversation participants read
-- each other's profile (name only is exposed via the RPC, not sensitive data).

CREATE POLICY "profiles_select_chat_participants"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE auth.uid() IN (c.candidato_id, c.empleador_id)
        AND profiles.id IN (c.candidato_id, c.empleador_id)
    )
  );
