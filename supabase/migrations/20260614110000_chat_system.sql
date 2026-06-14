-- Feature 2.3: Chat employer ↔ candidate
-- conversations + messages with strict RLS, realtime-ready.

-- 1. Conversations table
-- One conversation per (job_id, candidato_id) pair. Employer initiates.
CREATE TABLE conversations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidato_id  uuid        NOT NULL REFERENCES profiles(id),
  empleador_id  uuid        NOT NULL REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- One conversation per job-candidate pair
  CONSTRAINT uq_conversations_job_candidato UNIQUE (job_id, candidato_id)
);

CREATE INDEX idx_conversations_candidato ON conversations(candidato_id);
CREATE INDEX idx_conversations_empleador ON conversations(empleador_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Only participants can see their conversations
CREATE POLICY "Participants read own conversations" ON conversations
  FOR SELECT TO authenticated
  USING (auth.uid() IN (candidato_id, empleador_id));

-- Only the employer (who owns the job) can start a conversation
CREATE POLICY "Employer creates conversation" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = empleador_id
    AND EXISTS (
      SELECT 1 FROM jobs j
        JOIN companies c ON c.id = j.company_id
       WHERE j.id = job_id
         AND c.owner_id = auth.uid()
         AND j.deleted_at IS NULL
    )
    -- Only if the candidate actually applied to this job
    AND EXISTS (
      SELECT 1 FROM applications a
       WHERE a.job_id = conversations.job_id
         AND a.candidato_id = conversations.candidato_id
         AND a.deleted_at IS NULL
    )
  );

-- 2. Messages table
CREATE TABLE messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES profiles(id),
  body            text        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Only conversation participants can read messages
CREATE POLICY "Participants read messages" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
       WHERE c.id = conversation_id
         AND auth.uid() IN (c.candidato_id, c.empleador_id)
    )
  );

-- Only conversation participants can send messages
CREATE POLICY "Participants send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
       WHERE c.id = conversation_id
         AND auth.uid() IN (c.candidato_id, c.empleador_id)
    )
  );

-- Participants can mark messages as read (only the recipient, not the sender)
CREATE POLICY "Recipient marks messages read" ON messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
       WHERE c.id = conversation_id
         AND auth.uid() IN (c.candidato_id, c.empleador_id)
    )
    AND auth.uid() != sender_id
  )
  WITH CHECK (
    -- Only allow updating read_at, nothing else
    read_at IS NOT NULL
  );

-- 3. Immutability trigger: prevent changing sender_id, conversation_id, body after insert
CREATE OR REPLACE FUNCTION prevent_message_mutation()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'sender_id is immutable';
  END IF;
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
    RAISE EXCEPTION 'conversation_id is immutable';
  END IF;
  IF NEW.body IS DISTINCT FROM OLD.body THEN
    RAISE EXCEPTION 'body is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_message_immutability
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION prevent_message_mutation();

-- 4. RPC: get conversations with last message and unread count
CREATE OR REPLACE FUNCTION my_conversations()
RETURNS TABLE (
  id            uuid,
  job_id        uuid,
  candidato_id  uuid,
  empleador_id  uuid,
  created_at    timestamptz,
  job_titulo    text,
  company_nombre text,
  other_name    text,
  last_message  text,
  last_message_at timestamptz,
  unread_count  bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
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
  WHERE auth.uid() IN (c.candidato_id, c.empleador_id)
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC;
$$;

-- 5. RPC: total unread messages across all conversations (for badge)
CREATE OR REPLACE FUNCTION unread_messages_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT COALESCE(SUM(cnt), 0)::bigint
  FROM (
    SELECT count(*) AS cnt
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE auth.uid() IN (c.candidato_id, c.empleador_id)
      AND m.sender_id != auth.uid()
      AND m.read_at IS NULL
  ) sub;
$$;

-- 6. Enable Realtime for messages (Supabase Realtime listens to INSERT events)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 7. Abuse reporting foundation
CREATE TABLE message_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid        NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reporter_id     uuid        NOT NULL REFERENCES profiles(id),
  reason          text        NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_report_per_message UNIQUE (message_id, reporter_id)
);

ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Only participants can report
CREATE POLICY "Participants report messages" ON message_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    AND EXISTS (
      SELECT 1 FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
       WHERE m.id = message_id
         AND auth.uid() IN (c.candidato_id, c.empleador_id)
         AND m.sender_id != auth.uid()
    )
  );
