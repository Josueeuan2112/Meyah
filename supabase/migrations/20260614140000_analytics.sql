-- 20260614140000_analytics.sql
-- Feature 2.6: Analytics Dashboard for Employers
--
-- Infraestructura de analytics:
--   (1) Tabla job_events — registra vistas (y futuros eventos) con timestamp
--   (2) RPC record_job_view — inserta evento + incrementa views_count (backward compat)
--   (3) RPC employer_analytics — datos por vacante para el dashboard
--   (4) RPC employer_daily_stats — tendencia diaria de vistas y postulaciones

-- ============================================================
-- 1. TABLA: job_events
-- ============================================================

CREATE TABLE public.job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_job_events_job_created
  ON public.job_events (job_id, created_at);

COMMENT ON TABLE public.job_events
  IS 'Eventos anónimos sobre vacantes (vistas, etc.). Sin user_id por privacidad.';
COMMENT ON COLUMN public.job_events.event_type
  IS 'Tipo de evento. Hoy solo "view"; extensible a "share", "save", etc.';

-- RLS: el empleador puede leer eventos de sus propias vacantes
CREATE POLICY "job_events_select_owner"
  ON public.job_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.companies c ON c.id = j.company_id
      WHERE j.id = job_events.job_id
        AND c.owner_id = auth.uid()
    )
  );

-- INSERT: permitir a cualquier autenticado (el RPC hace el insert real con
-- SECURITY DEFINER, pero dejamos la policy abierta como fallback)
CREATE POLICY "job_events_insert_authenticated"
  ON public.job_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 2. RPC: record_job_view(p_job_id)
-- ============================================================
-- Reemplaza el uso de increment_job_views en el frontend.
-- SECURITY DEFINER: el candidato no tiene UPDATE en jobs (RLS).
-- Inserta evento + incrementa contador para backward compat.
-- Dedup simple: no registra si ya hay un evento 'view' para este job
-- en el último minuto (evita spam por refrescos rápidos).

CREATE OR REPLACE FUNCTION public.record_job_view(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Dedup: si ya existe un view para este job en el último minuto, salir
  IF EXISTS (
    SELECT 1 FROM public.job_events
    WHERE job_id = p_job_id
      AND event_type = 'view'
      AND created_at > NOW() - INTERVAL '1 minute'
  ) THEN
    RETURN;
  END IF;

  -- Insertar evento
  INSERT INTO public.job_events (job_id, event_type)
  VALUES (p_job_id, 'view');

  -- Incrementar contador (backward compat con views_count)
  UPDATE public.jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id AND deleted_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_job_view(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_job_view(UUID) TO authenticated;

-- ============================================================
-- 3. RPC: employer_analytics()
-- ============================================================
-- Devuelve métricas por vacante del empleador logueado:
--   job_id, job_titulo, views_total, applications_total, applications_by_status

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
SECURITY DEFINER
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

REVOKE EXECUTE ON FUNCTION public.employer_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.employer_analytics() TO authenticated;

-- ============================================================
-- 4. RPC: employer_daily_stats(p_days)
-- ============================================================
-- Devuelve vistas y postulaciones por día, agregadas sobre todas
-- las vacantes del empleador, para los últimos p_days días.

CREATE OR REPLACE FUNCTION public.employer_daily_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  day DATE,
  views BIGINT,
  applications BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

REVOKE EXECUTE ON FUNCTION public.employer_daily_stats(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.employer_daily_stats(INTEGER) TO authenticated;
