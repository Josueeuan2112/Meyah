-- 20260620110000_soft_delete_defensive_filters.sql
-- Defensa en profundidad del soft-delete: aunque la cascada de
-- 20260620100000 falle (o existan datos previos sin cascadear), los RPC y
-- policies de LECTURA deben filtrar deleted_at. Empresa borrada -> sus vacantes
-- no salen en el feed, sus conversaciones no se leen ni aceptan mensajes, su
-- rating va vacío.
--
-- Todas las definiciones de abajo se reescriben sobre la versión REAL vigente
-- leída en vivo (pg_get_functiondef / pg_policies). Ningún return shape cambia:
--   * jobs_near: misma firma y mismas 11 columnas -> CREATE OR REPLACE (no DROP).
--   * my_conversations: mismas 13 columnas -> CREATE OR REPLACE.
--   * unread_messages_count / company_rating: misma firma -> CREATE OR REPLACE.
-- Por eso gen:types NO debería cambiar de forma; solo se endurecen filtros.

-- ============================================================
-- 1. jobs_select_public_open: la empresa no debe estar borrada
-- ============================================================
-- Definición real (pg_policies):
--   (deleted_at IS NULL) AND (estado='abierta') AND (expires_at > now())
-- Se preserva intacta y se añade el EXISTS de empresa viva.
DROP POLICY IF EXISTS "jobs_select_public_open" ON public.jobs;

CREATE POLICY "jobs_select_public_open" ON public.jobs
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND estado = 'abierta'::job_status
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = jobs.company_id
        AND c.deleted_at IS NULL
    )
  );

-- ============================================================
-- 2. jobs_near: añadir c.deleted_at IS NULL al WHERE
-- ============================================================
-- Reescritura sobre la def real (5 args, search_path public/extensions). Único
-- cambio: AND c.deleted_at IS NULL en el WHERE de base. Se preservan EXACTOS:
-- distancia_m (st_distance real), filtro de radio (p_max_m), fallback sin
-- ubicación (ORDER BY created_at DESC), paginación LIMIT least(p_limit,50)/OFFSET,
-- company_is_verified, solo 'abierta'/no borrada/no expirada.
-- El ORDER BY KNN (operador <->) se evaluó y NO se reescribió: se comparó lado a
-- lado st_distance (spheroid, use_spheroid=true por defecto) contra location<->g
-- (sphere) con datos reales desde Mérida centro. Los rangos coincidieron en la
-- muestra actual, pero las distancias difieren hasta ~15 m y el delta cambia de
-- signo entre filas; con datos más densos (vacantes agrupadas) dos jobs cuya
-- distancia spheroid difiere <15 m pueden invertir su orden bajo el sphere del
-- índice. No se puede GARANTIZAR orden idéntico -> se deja el ORDER BY actual y
-- el comentario FUTURO. Solo se añade el filtro c.deleted_at de esta migración.
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
      AND c.deleted_at IS NULL
  )
  SELECT id, titulo, salario_min, salario_max, categoria, jornada,
         company_nombre, company_is_verified, distancia_m, lat, lng
  FROM base
  WHERE p_max_m IS NULL OR distancia_m IS NULL OR distancia_m <= p_max_m
  -- FUTURO: KNN con operador <-> sobre idx_jobs_location_gist para que el orden
  -- por cercanía use el índice GiST en lugar de calcular distancia por fila.
  ORDER BY distancia_m ASC NULLS LAST, created_at DESC
  LIMIT least(coalesce(p_limit, 30), 50)
  OFFSET greatest(coalesce(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION public.jobs_near(double precision, double precision, double precision, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jobs_near(double precision, double precision, double precision, int, int) TO authenticated, anon;

COMMENT ON FUNCTION public.jobs_near(double precision, double precision, double precision, int, int) IS
  'Feed de vacantes por cercanía. Paginado con p_limit (tope 50) / p_offset. Devuelve distancia_m (nunca coordenadas del candidato), company_is_verified para el badge, y solo vacantes abiertas/no expiradas de empresas no borradas. Orden: distancia ASC NULLS LAST, created_at DESC.';

-- ============================================================
-- 3. my_conversations: filtrar conversaciones/job/empresa borrados
-- ============================================================
-- Reescritura sobre la def real (13 columnas, DEFINER, search_path public).
-- Se preservan: el LATERAL de último mensaje, el LATERAL de unread_count, los
-- LEFT JOIN a jobs/companies, el guard de ownership y el ORDER BY. Se añade al
-- WHERE: la conversación no borrada, y la vacante/empresa de origen no borrada.
--   * Conversación "de vacante" (job_id NOT NULL): exigir j.deleted_at IS NULL.
--     La empresa de la vacante (co_job) tampoco debe estar borrada.
--   * Conversación "de empresa" (company_id NOT NULL): exigir co_dir no borrada.
-- Como es XOR, una sola rama aplica por fila; el predicado cubre ambas.
CREATE OR REPLACE FUNCTION public.my_conversations()
RETURNS TABLE (
  id              uuid,
  job_id          uuid,
  candidato_id    uuid,
  empleador_id    uuid,
  created_at      timestamptz,
  job_titulo      text,
  company_nombre  text,
  other_name      text,
  last_message    text,
  last_message_at timestamptz,
  unread_count    bigint,
  company_id      uuid,
  kind            text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    c.id,
    c.job_id,
    c.candidato_id,
    c.empleador_id,
    c.created_at,
    CASE
      WHEN c.job_id IS NOT NULL THEN j.titulo
      ELSE 'Mensaje directo'
    END                     AS job_titulo,
    COALESCE(co_job.nombre, co_dir.nombre) AS company_nombre,
    CASE
      WHEN auth.uid() = c.empleador_id THEN cp.nombre
      ELSE ep.nombre
    END                     AS other_name,
    lm.body                 AS last_message,
    lm.created_at           AS last_message_at,
    COALESCE(ur.cnt, 0)     AS unread_count,
    c.company_id,
    CASE WHEN c.job_id IS NOT NULL THEN 'job' ELSE 'company' END AS kind
  FROM conversations c
  LEFT JOIN jobs j        ON j.id = c.job_id
  LEFT JOIN companies co_job ON co_job.id = j.company_id
  LEFT JOIN companies co_dir ON co_dir.id = c.company_id
  JOIN profiles cp        ON cp.id = c.candidato_id
  JOIN profiles ep        ON ep.id = c.empleador_id
  LEFT JOIN LATERAL (
    SELECT m.body, m.created_at
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.sender_id != auth.uid()
      AND m.read_at IS NULL
  ) ur ON true
  -- Guard de ownership: solo conversaciones donde el llamante participa.
  WHERE auth.uid() IN (c.candidato_id, c.empleador_id)
    -- La conversación no está borrada.
    AND c.deleted_at IS NULL
    -- Rama "de vacante": la vacante y su empresa no están borradas.
    AND (c.job_id IS NULL OR (j.deleted_at IS NULL AND co_job.deleted_at IS NULL))
    -- Rama "de empresa": la empresa no está borrada.
    AND (c.company_id IS NULL OR co_dir.deleted_at IS NULL)
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.my_conversations() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.my_conversations() TO authenticated;

-- ============================================================
-- 4. unread_messages_count: no contar mensajes de hilos borrados
-- ============================================================
-- Def real: INVOKER, search_path public, suma de no-leídos por participante.
-- Se añade: conversación no borrada, y job/empresa de origen no borrada.
CREATE OR REPLACE FUNCTION public.unread_messages_count()
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(SUM(cnt), 0)::bigint
  FROM (
    SELECT count(*) AS cnt
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    LEFT JOIN jobs j ON j.id = c.job_id
    LEFT JOIN companies co_job ON co_job.id = j.company_id
    LEFT JOIN companies co_dir ON co_dir.id = c.company_id
    WHERE auth.uid() IN (c.candidato_id, c.empleador_id)
      AND m.sender_id != auth.uid()
      AND m.read_at IS NULL
      AND c.deleted_at IS NULL
      AND (c.job_id IS NULL OR (j.deleted_at IS NULL AND co_job.deleted_at IS NULL))
      AND (c.company_id IS NULL OR co_dir.deleted_at IS NULL)
  ) sub;
$$;

REVOKE EXECUTE ON FUNCTION public.unread_messages_count() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.unread_messages_count() TO authenticated;

-- ============================================================
-- 5. company_rating: empresa borrada -> agregado vacío
-- ============================================================
-- Def real: DEFINER, search_path public, devuelve round(avg) y count. Se añade
-- un guard: si la empresa está borrada (o no existe), no se agrega ninguna
-- review -> average_rating NULL, review_count 0. Mismo return shape.
CREATE OR REPLACE FUNCTION public.company_rating(p_company_id uuid)
RETURNS TABLE (average_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    round(avg(r.rating)::numeric, 1) AS average_rating,
    count(*)                          AS review_count
  FROM public.reviews r
  WHERE r.company_id = p_company_id
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = p_company_id
        AND c.deleted_at IS NULL
    );
$$;

REVOKE EXECUTE ON FUNCTION public.company_rating(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.company_rating(uuid) TO authenticated;

-- ============================================================
-- 6. "Participants send messages": no enviar en hilo borrado
-- ============================================================
-- Def real (with_check): auth.uid()=sender_id AND EXISTS(conversation con
-- participante). Se preserva y se añade que la conversación no esté borrada.
-- (Leer mensajes viejos sigue permitido; el bloqueo es solo para ENVIAR.)
DROP POLICY IF EXISTS "Participants send messages" ON public.messages;

CREATE POLICY "Participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
       WHERE c.id = conversation_id
         AND auth.uid() IN (c.candidato_id, c.empleador_id)
         AND c.deleted_at IS NULL
    )
  );
