-- 20260615030000_analytics_merida_tz.sql
--
-- B3: Los buckets diarios de analytics se calculaban en UTC, no en
-- America/Merida. Una vista a las 19:30 hora local (01:30 UTC del dia
-- siguiente) caia en el dia equivocado del grafico.
--
-- FIX
-- ---
-- En employer_daily_stats():
--   * created_at::date  ->  (created_at AT TIME ZONE 'America/Merida')::date
--   * CURRENT_DATE      ->  (now() AT TIME ZONE 'America/Merida')::date
-- Se preservan EXACTOS: la firma (p_days integer DEFAULT 30), el return shape
-- (day date, views bigint, applications bigint), el bounds check (1..365),
-- SECURITY INVOKER, search_path y todo lo demas.
--
-- employer_analytics() NO se toca: solo calcula totales acumulados (no agrupa por
-- dia), asi que no tiene buckets afectados por la zona horaria.
--
-- Return shape sin cambios -> gen:types no cambia.

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
DECLARE
  -- "Hoy" anclado a la zona horaria local de Merida.
  v_today date := (now() AT TIME ZONE 'America/Merida')::date;
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
      v_today - (p_days - 1),
      v_today,
      '1 day'::interval
    ) AS d
  ),
  daily_views AS (
    SELECT (je.created_at AT TIME ZONE 'America/Merida')::date AS day, COUNT(*) AS cnt
    FROM public.job_events je
    WHERE je.job_id IN (SELECT id FROM employer_jobs)
      AND je.event_type = 'view'
      AND (je.created_at AT TIME ZONE 'America/Merida')::date >= v_today - (p_days - 1)
    GROUP BY (je.created_at AT TIME ZONE 'America/Merida')::date
  ),
  daily_apps AS (
    SELECT (a.created_at AT TIME ZONE 'America/Merida')::date AS day, COUNT(*) AS cnt
    FROM public.applications a
    WHERE a.job_id IN (SELECT id FROM employer_jobs)
      AND a.deleted_at IS NULL
      AND (a.created_at AT TIME ZONE 'America/Merida')::date >= v_today - (p_days - 1)
    GROUP BY (a.created_at AT TIME ZONE 'America/Merida')::date
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
