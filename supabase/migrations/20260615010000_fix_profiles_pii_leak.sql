-- 20260615010000_fix_profiles_pii_leak.sql
--
-- S1 (CRITICO) + S2: Fuga de coordenadas/PII del candidato via RLS de fila.
--
-- PROBLEMA
-- --------
-- Las policies anchas de SELECT sobre public.profiles exponian la FILA COMPLETA
-- del candidato (lat_referencia, lng_referencia, phone, cv_path) al empleador y a
-- los participantes de chat:
--   * profiles_select_applicants      (USING current_user_can_view_applicant(id))
--   * profiles_select_chat_participants (USING EXISTS conversacion compartida)
-- Esto contradice la regla de negocio: el empleador solo debe ver DISTANCIA, no
-- las coordenadas exactas, ni el telefono (salvo postulacion aceptada, ver S2).
--
-- Reproducido con datos reales (rol authenticated + jwt del empleador duenio del
-- job): el empleador podia hacer
--   select lat_referencia, lng_referencia, phone from profiles where id = <candidato>
-- y obtener las coordenadas exactas. Eso es lo que cerramos aqui.
--
-- Por que existian esas policies: tres funciones eran SECURITY INVOKER y hacian
-- JOIN sobre profiles de OTROS usuarios, por lo que dependian de esas policies
-- para no devolver cero filas:
--   * my_conversations()              -> JOIN profiles (nombre del otro)
--   * job_applicants_near(uuid)       -> JOIN profiles (nombre + distancia)
--   * my_jobs_applicant_proximity()   -> JOIN profiles (lat/lng para distancia)
--
-- SOLUCION
-- --------
-- Convertir esas tres funciones a SECURITY DEFINER con search_path fijo,
-- preservando EXACTAMENTE su return shape y su guard de autorizacion scoped a
-- auth.uid(). Asi cada funcion sigue devolviendo SOLO lo que el llamante tiene
-- derecho a ver (nombre, distancia, etc.) sin exponer la fila cruda. Una vez que
-- ninguna funcion INVOKER depende de las policies anchas, se eliminan.
--
-- Tras esta migracion, un empleador / participante de chat NO puede hacer SELECT
-- de filas de profiles de otros usuarios. El nombre del otro llega unicamente por
-- my_conversations() / job_applicants_near() (ahora DEFINER). Queda intacta
-- profiles_select_own (cada quien lee su propia fila).
--
-- NOTA return shape: ninguna firma ni columna cambia -> los tipos generados
-- (gen:types) NO cambian.


-- ============================================================
-- 1. my_conversations(): INVOKER -> DEFINER
-- ============================================================
-- Guard de autorizacion: el WHERE auth.uid() IN (c.candidato_id, c.empleador_id)
-- ya restringe a conversaciones del propio usuario. Solo expone el NOMBRE del
-- otro participante (other_name), no datos sensibles. Mismo return shape exacto.

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
  unread_count    bigint
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
    j.titulo                AS job_titulo,
    co.nombre               AS company_nombre,
    CASE
      WHEN auth.uid() = c.empleador_id THEN cp.nombre
      ELSE ep.nombre
    END                     AS other_name,
    lm.body                 AS last_message,
    lm.created_at           AS last_message_at,
    COALESCE(ur.cnt, 0)     AS unread_count
  FROM conversations c
  JOIN jobs j     ON j.id = c.job_id
  JOIN companies co ON co.id = j.company_id
  JOIN profiles cp ON cp.id = c.candidato_id
  JOIN profiles ep ON ep.id = c.empleador_id
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
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.my_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_conversations() TO authenticated;


-- ============================================================
-- 2. job_applicants_near(uuid): INVOKER -> DEFINER  (+ S2 phone gating)
-- ============================================================
-- Guard de ownership: solo el empleador duenio del job puede llamarla (raise si
-- no). Mismo return shape exacto. Aqui integramos S2:
--   * candidato_phone: el telefono SOLO se devuelve cuando a.estado='aceptada';
--     en otro caso NULL. La columna sigue siendo text (NULL condicional), no
--     cambia el tipo ni el nombre -> gen:types no cambia.
--   * cv_path: SIEMPRE poblado (decision de producto: las empresas pasan filtro
--     de verificacion riguroso, el CV puede verse antes de aceptar).
--   * distancia_m: el empleador ve la distancia derivada, NUNCA lat/lng crudas.
-- Hay que hacer DROP + CREATE porque cambia el cuerpo y queremos asegurar la
-- firma exacta; el return shape se mantiene identico.

DROP FUNCTION IF EXISTS public.job_applicants_near(uuid);

CREATE FUNCTION public.job_applicants_near(p_job_id uuid)
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
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  -- Guard de ownership: solo el empleador que posee el job puede llamarla.
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
    -- S2: telefono solo visible tras aceptacion.
    CASE
      WHEN a.estado = 'aceptada'::application_status THEN p.phone
      ELSE NULL
    END         AS candidato_phone,
    -- CV siempre visible (decision de producto).
    p.cv_path,
    -- El empleador ve la DISTANCIA, nunca las coordenadas exactas.
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
-- 3. my_jobs_applicant_proximity(): INVOKER -> DEFINER  (+ owner guard)
-- ============================================================
-- Esta funcion hacia JOIN sobre profiles de OTROS usuarios (lat/lng del
-- candidato) para contar cuantos postulantes estan cerca de cada job. Era
-- INVOKER y dependia de profiles_select_applicants. Al pasarla a DEFINER bypasa
-- RLS, por lo que AGREGAMOS un guard de ownership (c.owner_id = auth.uid()) para
-- que solo cuente jobs del propio empleador (el frontend la usa para
-- ['jobs','mine','proximity']). Sin ese guard, DEFINER expondria conteos de
-- proximidad de jobs ajenos -> seria una fuga nueva.
-- Return shape identico: (job_id uuid, cercanos bigint).

CREATE OR REPLACE FUNCTION public.my_jobs_applicant_proximity(p_max_m double precision DEFAULT 3000)
RETURNS TABLE (
  job_id   uuid,
  cercanos bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
  SELECT a.job_id, count(*)::bigint AS cercanos
  FROM applications a
  JOIN jobs j      ON j.id = a.job_id
  JOIN companies c ON c.id = j.company_id
  JOIN profiles p  ON p.id = a.candidato_id
  WHERE a.deleted_at IS NULL
    -- Guard de ownership: solo jobs del empleador llamante.
    AND c.owner_id = auth.uid()
    AND j.deleted_at IS NULL
    AND j.location IS NOT NULL
    AND p.lat_referencia IS NOT NULL AND p.lng_referencia IS NOT NULL
    AND st_distance(
          j.location,
          st_setsrid(st_makepoint(p.lng_referencia, p.lat_referencia), 4326)::geography
        ) <= p_max_m
  GROUP BY a.job_id;
$$;

REVOKE EXECUTE ON FUNCTION public.my_jobs_applicant_proximity(double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_jobs_applicant_proximity(double precision) TO authenticated;


-- ============================================================
-- 4. Eliminar las policies anchas de SELECT sobre profiles
-- ============================================================
-- Ya ninguna funcion INVOKER depende de ellas (las tres pasaron a DEFINER).
-- Tras esto, un empleador / participante de chat NO puede SELECT filas de
-- profiles de otros usuarios. profiles_select_own queda intacta.

DROP POLICY IF EXISTS "profiles_select_chat_participants" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_applicants" ON public.profiles;

-- El helper current_user_can_view_applicant(uuid) (SECURITY DEFINER) ya no es
-- usado por ninguna policy tras este cambio. Se deja en su lugar por si futuras
-- migraciones lo reutilizan; no expone datos por si solo (devuelve boolean).
