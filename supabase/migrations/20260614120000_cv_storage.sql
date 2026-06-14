-- Feature 2.4: CV upload via Supabase Storage
-- Private bucket 'cvs', RLS on storage, cv_path column in profiles.

-- 1. Add cv_path to profiles (stores the storage path, e.g., "<user_id>/cv.pdf")
ALTER TABLE profiles ADD COLUMN cv_path text;

-- 2. Create the storage bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs',
  false,
  5242880, -- 5 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies

-- Candidates can upload their own CV (path must start with their user_id)
CREATE POLICY "Candidates upload own CV" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM profiles
       WHERE id = auth.uid()
         AND tipo = 'candidato'
         AND deleted_at IS NULL
    )
  );

-- Candidates can read their own CV
CREATE POLICY "Candidates read own CV" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Candidates can update (replace) their own CV
CREATE POLICY "Candidates update own CV" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Candidates can delete their own CV
CREATE POLICY "Candidates delete own CV" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Employers can read a candidate's CV only if that candidate applied to one of their jobs
CREATE POLICY "Employers read applicant CV" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs'
    AND EXISTS (
      SELECT 1 FROM applications a
        JOIN jobs j     ON j.id = a.job_id
        JOIN companies c ON c.id = j.company_id
       WHERE a.candidato_id = ((storage.foldername(name))[1])::uuid
         AND c.owner_id = auth.uid()
         AND a.deleted_at IS NULL
         AND j.deleted_at IS NULL
    )
  );
