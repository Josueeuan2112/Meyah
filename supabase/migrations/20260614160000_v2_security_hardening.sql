-- 20260614160000_v2_security_hardening.sql
-- Security hardening for all V2 features based on security audit.
-- Fixes: RLS gaps, SECURITY DEFINER removal, immutability triggers,
-- admin report access, analytics INSERT lockdown, ownership checks.

-- ============================================================
-- 1. ANALYTICS: Lock down job_events direct INSERT
-- ============================================================
-- The record_job_view() RPC is SECURITY DEFINER and handles inserts.
-- Block direct client inserts to prevent analytics data corruption.

DROP POLICY IF EXISTS "job_events_insert_authenticated" ON public.job_events;

CREATE POLICY "job_events_insert_blocked"
  ON public.job_events FOR INSERT TO authenticated
  WITH CHECK (false);

-- ============================================================
-- 2. ANALYTICS: SECURITY DEFINER → SECURITY INVOKER + bounds
-- ============================================================
-- These functions filter by auth.uid() internally and only need
-- access to tables the employer already has RLS access to.

CREATE OR REPLACE FUNCTION public.employer_analytics()
RETURNS TABLE (
  job_id UUID,
  job_titulo TEXT,
  views_total BIGINT,
  applications_total BIGINT,
  applications_by_status JSONB
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT
    j.id      AS job_id,
    j.titulo  AS job_titulo,
    (
      SELECT COUNT(*)
      FROM public.job_events je
      WHERE je.job_id = j.id AND je.event_type = 'view'
    ) AS views_total,
    (
      SELECT COUNT(*)
      FROM public.applications a
      WHERE a.job_id = j.id AND a.deleted_at IS NULL
    ) AS applications_total,
    COALESCE(
      (
        SELECT jsonb_object_agg(sub.estado, sub.cnt)
        FROM (
          SELECT a2.estado::text AS estado, COUNT(*) AS cnt
          FROM public.applications a2
          WHERE a2.job_id = j.id AND a2.deleted_at IS NULL
          GROUP BY a2.estado
        ) sub
      ),
      '{}'::jsonb
    ) AS applications_by_status
  FROM public.jobs j
  JOIN public.companies c ON c.id = j.company_id
  WHERE c.owner_id = auth.uid()
    AND j.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.employer_daily_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  day DATE,
  views BIGINT,
  applications BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
BEGIN
  -- Bounds check: prevent DoS via huge date range
  IF p_days < 1 OR p_days > 365 THEN
    RAISE EXCEPTION 'p_days must be between 1 and 365';
  END IF;

  RETURN QUERY
  WITH employer_jobs AS (
    SELECT j.id
    FROM public.jobs j
    JOIN public.companies c ON c.id = j.company_id
    WHERE c.owner_id = auth.uid()
      AND j.deleted_at IS NULL
  ),
  date_series AS (
    SELECT d::date AS day
    FROM generate_series(
      CURRENT_DATE - (p_days - 1),
      CURRENT_DATE,
      '1 day'::interval
    ) AS d
  ),
  daily_views AS (
    SELECT je.created_at::date AS day, COUNT(*) AS cnt
    FROM public.job_events je
    WHERE je.job_id IN (SELECT id FROM employer_jobs)
      AND je.event_type = 'view'
      AND je.created_at >= CURRENT_DATE - (p_days - 1)
    GROUP BY je.created_at::date
  ),
  daily_apps AS (
    SELECT a.created_at::date AS day, COUNT(*) AS cnt
    FROM public.applications a
    WHERE a.job_id IN (SELECT id FROM employer_jobs)
      AND a.deleted_at IS NULL
      AND a.created_at >= CURRENT_DATE - (p_days - 1)
    GROUP BY a.created_at::date
  )
  SELECT
    ds.day,
    COALESCE(dv.cnt, 0) AS views,
    COALESCE(da.cnt, 0) AS applications
  FROM date_series ds
  LEFT JOIN daily_views dv ON dv.day = ds.day
  LEFT JOIN daily_apps da ON da.day = ds.day
  ORDER BY ds.day;
END;
$$;

-- ============================================================
-- 3. CHAT: Protect created_at and id immutability on messages
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_message_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'id is immutable';
  END IF;
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'sender_id is immutable';
  END IF;
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
    RAISE EXCEPTION 'conversation_id is immutable';
  END IF;
  IF NEW.body IS DISTINCT FROM OLD.body THEN
    RAISE EXCEPTION 'body is immutable';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'created_at is immutable';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. CHAT: Admin can read message reports
-- ============================================================

CREATE POLICY "reporters_read_own_message_reports" ON message_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "admins_read_all_message_reports" ON message_reports
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- ============================================================
-- 5. REVIEWS: Admin can read/delete review reports and reviews
-- ============================================================

CREATE POLICY "reporters_read_own_review_reports"
  ON public.review_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "admins_read_all_review_reports"
  ON public.review_reports FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

CREATE POLICY "admins_delete_abusive_reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins));

-- ============================================================
-- 6. REVIEWS: Add search_path to company_rating
-- ============================================================

CREATE OR REPLACE FUNCTION public.company_rating(p_company_id uuid)
RETURNS TABLE (average_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT
    round(avg(r.rating)::numeric, 1) AS average_rating,
    count(*)                          AS review_count
  FROM public.reviews r
  WHERE r.company_id = p_company_id;
$$;

-- ============================================================
-- 7. JOB_APPLICANTS_NEAR: Add explicit ownership check
-- ============================================================

DROP FUNCTION IF EXISTS public.job_applicants_near(uuid);

CREATE OR REPLACE FUNCTION public.job_applicants_near(p_job_id uuid)
RETURNS TABLE (
  id               uuid,
  candidato_id     uuid,
  estado           application_status,
  mensaje          text,
  created_at       timestamptz,
  viewed_at        timestamptz,
  candidato_nombre text,
  candidato_phone  text,
  cv_path          text,
  distancia_m      double precision
)
LANGUAGE plpgsql
STABLE
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  -- Explicit ownership check: only the employer who owns the job can call this
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.companies c ON c.id = j.company_id
    WHERE j.id = p_job_id
      AND c.owner_id = auth.uid()
      AND j.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'access denied: you do not own this job';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.candidato_id,
    a.estado,
    a.mensaje,
    a.created_at,
    a.viewed_at,
    p.nombre    AS candidato_nombre,
    p.phone     AS candidato_phone,
    p.cv_path,
    CASE
      WHEN j.location IS NOT NULL
       AND p.lat_referencia IS NOT NULL
       AND p.lng_referencia IS NOT NULL
      THEN st_distance(
             j.location,
             st_setsrid(st_makepoint(p.lng_referencia, p.lat_referencia), 4326)::geography
           )
      ELSE NULL
    END AS distancia_m
  FROM public.applications a
  JOIN public.jobs j     ON j.id = a.job_id
  JOIN public.profiles p ON p.id = a.candidato_id
  WHERE a.job_id = p_job_id
    AND a.deleted_at IS NULL
  ORDER BY distancia_m ASC NULLS LAST, a.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.job_applicants_near(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_applicants_near(uuid) TO authenticated;

-- ============================================================
-- 8. CV STORAGE: Add tipo='candidato' check to SELECT/UPDATE/DELETE
-- ============================================================
-- The INSERT policy already checks tipo='candidato'. Align the others.

DROP POLICY IF EXISTS "Candidates read own CV" ON storage.objects;
CREATE POLICY "Candidates read own CV" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM profiles
       WHERE id = auth.uid()
         AND tipo = 'candidato'
         AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Candidates update own CV" ON storage.objects;
CREATE POLICY "Candidates update own CV" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM profiles
       WHERE id = auth.uid()
         AND tipo = 'candidato'
         AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Candidates delete own CV" ON storage.objects;
CREATE POLICY "Candidates delete own CV" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM profiles
       WHERE id = auth.uid()
         AND tipo = 'candidato'
         AND deleted_at IS NULL
    )
  );

-- ============================================================
-- 9. COMPANY VERIFICATION: Restrict admin UPDATE to verification fields
-- ============================================================
-- The trigger already blocks non-admins from changing is_verified/verified_at.
-- Now also block admins from changing anything EXCEPT those fields.

CREATE OR REPLACE FUNCTION public.prevent_verification_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  is_admin boolean;
BEGIN
  is_admin := EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());

  -- Non-admins cannot change verification fields
  IF NOT is_admin THEN
    IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified)
       OR (NEW.verified_at IS DISTINCT FROM OLD.verified_at) THEN
      RAISE EXCEPTION 'solo administradores pueden modificar is_verified y verified_at';
    END IF;
  END IF;

  -- Admins can ONLY change verification fields (principle of least privilege)
  IF is_admin AND auth.uid() != OLD.owner_id THEN
    IF (NEW.owner_id IS DISTINCT FROM OLD.owner_id)
       OR (NEW.nombre IS DISTINCT FROM OLD.nombre)
       OR (NEW.descripcion IS DISTINCT FROM OLD.descripcion)
       OR (NEW.logo_url IS DISTINCT FROM OLD.logo_url)
       OR (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at) THEN
      RAISE EXCEPTION 'admins can only modify verification fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 10. ANALYTICS: Validate job exists in record_job_view
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_job_view(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate the job exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = p_job_id
      AND deleted_at IS NULL
      AND estado = 'abierta'
  ) THEN
    RETURN;
  END IF;

  -- Dedup: if a view was already recorded in the last minute, skip
  IF EXISTS (
    SELECT 1 FROM public.job_events
    WHERE job_id = p_job_id
      AND event_type = 'view'
      AND created_at > NOW() - INTERVAL '1 minute'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.job_events (job_id, event_type)
  VALUES (p_job_id, 'view');

  UPDATE public.jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id AND deleted_at IS NULL;
END;
$$;
