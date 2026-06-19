-- 20260616030000_jobs_near_pagination.sql
-- TAREA #5b: paginar jobs_near (el endpoint más caliente del feed).
--
-- PROBLEMA
-- --------
-- jobs_near devuelve hoy el catálogo COMPLETO de vacantes abiertas. A medida que
-- crece el número de vacantes, cada carga del feed transfiere todo el catálogo:
-- payload sin tope. Consumido por src/features/jobs/hooks/useNearbyJobs.ts.
--
-- ENFOQUE
-- -------
-- Agregar DOS parámetros nuevos CON DEFAULT (p_limit, p_offset) para no romper a
-- los callers actuales (la firma vieja de 3 args se reemplaza, pero los callers
-- siguen llamando con los mismos 3 args nombrados). Se aplica LIMIT/OFFSET al
-- final, DESPUÉS del ORDER BY existente. p_limit se acota a un máximo sano para
-- que el cliente no pueda pedir 10000 filas de un tirón.
--
-- Se PRESERVAN todas las cláusulas de la versión vigente
-- (20260614130100_jobs_near_verified.sql), verificadas contra la definición real
-- vía pg_get_functiondef:
--   * filtro de radio (p_max_m)
--   * fallback sin ubicación (distancia_m NULL -> ORDER BY created_at DESC)
--   * flag company_is_verified (badge en las cards del feed)
--   * solo vacantes 'abierta', no borradas, no expiradas
--   * PII: devuelve distancia_m, NUNCA coordenadas del candidato
--
-- NO se cambia el ORDER BY (el reorder KNN con el operador <-> es una
-- optimización aparte y arriesgada; queda anotada como FUTURO).
--
-- Agregar params cambia la firma -> DROP + CREATE obligatorio. Se re-otorgan los
-- grants explícitos y se re-agrega el COMMENT.

-- La firma vieja (3 args) se reemplaza por la nueva (5 args). Como las firmas son
-- distintas, hay que dropear explícitamente la vieja para no dejar dos overloads.
DROP FUNCTION IF EXISTS public.jobs_near(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION public.jobs_near(
  p_lat    double precision DEFAULT NULL,
  p_lng    double precision DEFAULT NULL,
  p_max_m  double precision DEFAULT NULL,
  p_limit  int              DEFAULT 30,
  p_offset int              DEFAULT 0
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
  -- FUTURO: KNN con operador <-> sobre idx_jobs_location_gist para que el orden
  -- por cercanía use el índice GiST en lugar de calcular distancia por fila.
  ORDER BY distancia_m ASC NULLS LAST, created_at DESC
  -- Acota el payload del feed. p_limit topado a 50 para que el cliente no pueda
  -- pedir el catálogo completo; coalesce protege contra NULL explícito.
  LIMIT least(coalesce(p_limit, 30), 50)
  OFFSET greatest(coalesce(p_offset, 0), 0);
$$;

-- Grants explícitos: se mantiene anon (feed público futuro) y authenticated.
REVOKE ALL ON FUNCTION public.jobs_near(double precision, double precision, double precision, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jobs_near(double precision, double precision, double precision, int, int) TO authenticated, anon;

COMMENT ON FUNCTION public.jobs_near(double precision, double precision, double precision, int, int) IS
  'Feed de vacantes por cercanía. Paginado con p_limit (tope 50) / p_offset. Devuelve distancia_m (nunca coordenadas del candidato), company_is_verified para el badge, y solo vacantes abiertas/no expiradas. Orden: distancia ASC NULLS LAST, created_at DESC.';
