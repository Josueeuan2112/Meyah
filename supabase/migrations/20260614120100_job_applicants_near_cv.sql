-- Add cv_path to job_applicants_near return columns (for "Ver CV" button)
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
LANGUAGE sql
STABLE
SET search_path = 'public', 'extensions'
AS $$
  WITH base AS (
    SELECT
      a.id,
      a.candidato_id,
      a.estado,
      a.mensaje,
      a.created_at,
      a.viewed_at,
      p.nombre  AS candidato_nombre,
      p.phone   AS candidato_phone,
      p.cv_path AS cv_path,
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
    FROM applications a
    JOIN jobs j     ON j.id = a.job_id
    JOIN profiles p ON p.id = a.candidato_id
    WHERE a.job_id = p_job_id
      AND a.deleted_at IS NULL
  )
  SELECT id, candidato_id, estado, mensaje, created_at, viewed_at,
         candidato_nombre, candidato_phone, cv_path, distancia_m
  FROM base
  ORDER BY distancia_m ASC NULLS LAST, created_at DESC;
$$;
