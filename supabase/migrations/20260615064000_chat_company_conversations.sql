-- 20260615064000_chat_company_conversations.sql
-- V2 — "Enviar mensaje" empresa↔candidato SIN postulación previa (PIEZA R1).
--
-- CONTEXTO (definiciones REALES leídas de los .sql, no de memoria):
--   * conversations (20260614110000): job_id NOT NULL, candidato_id NOT NULL,
--     empleador_id NOT NULL, UNIQUE (job_id, candidato_id). El empleador inicia
--     y solo si el candidato ya se postuló.
--   * Policies messages SELECT/INSERT/UPDATE: TODAS keyean por participante via
--     auth.uid() IN (c.candidato_id, c.empleador_id). NO se tocan: siguen
--     funcionando si empleador_id guarda al "otro" participante.
--   * my_conversations() definición vigente: 20260615010000 (SECURITY DEFINER,
--     search_path=public, GRANT a authenticated, REVOKE de PUBLIC/anon). Esa es
--     la base que reescribimos aquí (NO la versión original INVOKER).
--
-- DISEÑO (opción E1 del PM):
--   Una conversación es de DOS clases mutuamente excluyentes (XOR):
--     (a) "de vacante":  job_id NOT NULL  AND company_id NULL    (modelo viejo)
--     (b) "de empresa":  company_id NOT NULL AND job_id NULL      (modelo nuevo)
--   En ambos casos los DOS participantes son (candidato_id, empleador_id). Para
--   una conversación de empresa, empleador_id = companies.owner_id (el dueño de
--   la empresa ES el empleador contraparte). Así las policies de messages y la
--   SELECT de conversations ("auth.uid() IN (candidato_id, empleador_id)")
--   siguen valiendo SIN cambios: candidato y owner ven la conversación y pueden
--   mandar mensajes; NADIE más.
--
-- gen:types CAMBIA (nueva columna conversations.company_id; my_conversations()
-- gana columnas aditivas company_id y kind).

-- ============================================================
-- 1. Columna company_id + job_id nullable
-- ============================================================
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- job_id es hoy NOT NULL (verificado en 20260614110000). Lo hacemos nullable
-- para permitir conversaciones de empresa (job_id NULL).
ALTER TABLE public.conversations
  ALTER COLUMN job_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_company ON public.conversations(company_id)
  WHERE company_id IS NOT NULL;

COMMENT ON COLUMN public.conversations.company_id IS 'Empresa de la conversación cuando es "de empresa" (candidato inició sin postulación). XOR con job_id. empleador_id = companies.owner_id en ese caso.';

-- ============================================================
-- 2. Invariante XOR (de vacante O de empresa, nunca ambas ni ninguna)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_kind_xor') THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_kind_xor CHECK (
        (job_id IS NOT NULL AND company_id IS NULL)
        OR
        (job_id IS NULL AND company_id IS NOT NULL)
      );
  END IF;
END $$;

-- ============================================================
-- 3. UNIQUE parciales (el UNIQUE total previo NO distingue clases)
-- ============================================================
-- El UNIQUE original uq_conversations_job_candidato (job_id, candidato_id) ya no
-- sirve para conversaciones de empresa (job_id NULL) y, siendo total, dos
-- conversaciones de empresa con job_id NULL no chocarían entre sí pero podrían
-- chocar de forma rara con NULLs. Lo reemplazamos por dos índices únicos
-- parciales explícitos, uno por clase.
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS uq_conversations_job_candidato;

-- Una conversación por (job, candidato) entre las de vacante.
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_job_candidato
  ON public.conversations (job_id, candidato_id)
  WHERE job_id IS NOT NULL;

-- Una conversación por (empresa, candidato) entre las de empresa. Esto evita
-- duplicados y, de paso, limita el spam: un candidato no puede abrir N
-- conversaciones contra la misma empresa (ver nota de spam abajo).
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_company_candidato
  ON public.conversations (company_id, candidato_id)
  WHERE company_id IS NOT NULL;

-- ============================================================
-- 4. INSERT policy: el candidato inicia conversación de empresa
-- ============================================================
-- La policy existente "Employer creates conversation" cubre SOLO el caso de
-- vacante (exige empleador_id = auth.uid() + ownership del job + postulación).
-- Agregamos una policy NUEVA para el caso de empresa SIN tocar la vieja.
-- Restrictiva: el candidato debe ser tipo 'candidato', la empresa debe existir
-- y no estar borrada, y empleador_id DEBE ser exactamente el owner real de la
-- empresa (impide fijar a un tercero como participante o falsear al dueño).
CREATE POLICY "Candidate creates company conversation" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Clase "de empresa".
    company_id IS NOT NULL
    AND job_id IS NULL
    -- El creador es el candidato.
    AND auth.uid() = candidato_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'candidato'
    )
    -- La empresa existe, no está borrada, y empleador_id = su owner real.
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = conversations.company_id
        AND c.deleted_at IS NULL
        AND c.owner_id = conversations.empleador_id
    )
  );

-- Las policies SELECT ("Participants read own conversations") y las de messages
-- (read/send/mark-read) ya usan auth.uid() IN (candidato_id, empleador_id) y NO
-- requieren cambios: como empleador_id = owner de la empresa, tanto el candidato
-- como el dueño ven la conversación y pueden enviar/leer mensajes. NADIE más.

-- ============================================================
-- 5. my_conversations(): LEFT JOIN a jobs + derivar de companies
-- ============================================================
-- Reescritura sobre la definición REAL (20260615010000): SECURITY DEFINER,
-- search_path=public, guard de ownership por auth.uid(), LATERALes de
-- last_message y unread_count, ORDER BY. Cambios:
--   * JOIN jobs -> LEFT JOIN (job_id puede ser NULL).
--   * JOIN companies co -> derivar la empresa de jobs (vacante) O directo de
--     conversations.company_id (empresa) vía LEFT JOINs y COALESCE.
--   * job_titulo: para conversación de empresa NO hay vacante; se pone una
--     etiqueta fija ('Mensaje directo') para que el frontend ACTUAL, que
--     renderiza "{job_titulo} · {company_nombre}", no muestre " · Empresa" con
--     un null colgando. Es cambio de contenido, no de forma.
--   * Columnas ADITIVAS al final: company_id (uuid) y kind (text 'job'|'company')
--     para que el frontend pueda branchear en el futuro. El resto del return
--     shape y el orden de las 11 columnas previas se preservan intactos -> el
--     consumo actual (job_titulo, company_nombre, other_name, last_message,
--     last_message_at, unread_count, job_id) sigue válido.
--
-- DROP + RECREATE obligatorio: cambia el return shape (RETURNS TABLE gana 2
-- columnas). CREATE OR REPLACE no puede alterar la firma de retorno in-place
-- (SQLSTATE 42P13). Hacemos DROP explícito y recreamos con los grants.
DROP FUNCTION IF EXISTS public.my_conversations();

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
    -- Vacante: título real. Empresa: etiqueta fija (no hay job).
    CASE
      WHEN c.job_id IS NOT NULL THEN j.titulo
      ELSE 'Mensaje directo'
    END                     AS job_titulo,
    -- Empresa de la conversación: de la vacante (jobs.company_id) o directa.
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
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC;
$$;

-- Re-aplicar grants (CREATE OR REPLACE conserva los previos, pero los fijamos
-- explícitamente para no depender de eso).
REVOKE EXECUTE ON FUNCTION public.my_conversations() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.my_conversations() TO authenticated;

-- ============================================================
-- NOTA PARA SECURITY-REVIEWER (R1 / spam)
-- ============================================================
-- 1) Aislamiento: una conversación de empresa solo es visible para
--    (candidato_id, empleador_id=owner). Verificar con dos JWTs distintos que
--    un tercero (otro candidato u otro empleador) recibe 0 filas tanto en
--    SELECT directo de conversations como en messages y en my_conversations().
-- 2) Integridad del participante: la INSERT policy fuerza empleador_id = owner
--    real de la empresa. Sin eso, un candidato podría inyectar a un tercero como
--    "empleador_id" y volverlo participante (fuga). Reproducir el intento:
--    INSERT con empleador_id = <otro_user> debe fallar la WITH CHECK.
-- 3) Spam: el índice único parcial uq_conversations_company_candidato impide N
--    conversaciones del mismo candidato contra la misma empresa (máx 1). NO hay
--    rate-limit de MENSAJES dentro de una conversación abierta; el body sigue
--    acotado a 1..2000 chars (CHECK de messages) y existe message_reports para
--    moderación. Si se observa abuso de mensajes, considerar rate-limit a nivel
--    de INSERT en messages (no trivial en RLS; candidato a Edge Function o
--    trigger con ventana temporal). Documentado, no implementado (YAGNI MVP).
-- 4) Empresa borrada: ON DELETE CASCADE en company_id elimina la conversación si
--    la empresa se borra DURO. El soft-delete (deleted_at) NO cascadea: una
--    conversación de empresa soft-deleted seguiría visible para sus
--    participantes. Decisión: aceptable en MVP (no se exponen datos de la
--    empresa más allá del nombre ya intercambiado). Anotado para revisión.
