-- Add company_is_verified to jobs_near return columns (for badge in feed cards)
DROP FUNCTION IF EXISTS public.jobs_near(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION public.jobs_near(
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL,
  p_max_m double precision DEFAULT NULL
)
RETURNS TABLE (
  id                   uuid,
  titulo               text,
  salario_min          integer,
  salario_max          integer,
  categoria            text,
  jornada              job_schedule,
  company_nombre       text,
  company_is_verified  boolean,
  distancia_m          double precision,
  lat                  double precision,
  lng                  double precision
)
LANGUAGE sql
STABLE
SET search_path = 'public', 'extensions'
AS $$
  WITH base AS (
    SELECT
      j.id,
      j.titulo,
      j.salario_min,
      j.salario_max,
      j.categoria,
      j.jornada,
      c.nombre       AS company_nombre,
      c.is_verified  AS company_is_verified,
      j.created_at,
      CASE
        WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND j.location IS NOT NULL
        THEN st_distance(j.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography)
        ELSE NULL
      END AS distancia_m,
      st_y(j.location::geometry) AS lat,
      st_x(j.location::geometry) AS lng
    FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.estado = 'abierta'::job_status
      AND j.deleted_at IS NULL
      AND j.expires_at > now()
  )
  SELECT id, titulo, salario_min, salario_max, categoria, jornada,
         company_nombre, company_is_verified, distancia_m, lat, lng
  FROM base
  WHERE p_max_m IS NULL OR distancia_m IS NULL OR distancia_m <= p_max_m
  ORDER BY distancia_m ASC NULLS LAST, created_at DESC;
$$;
