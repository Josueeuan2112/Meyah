-- Feature 2.1: Email notifications infrastructure
-- Adds opt-out preference, notification logging for idempotency,
-- and a trigger that calls the Edge Function on application changes.

-- 1. Email opt-out column on profiles
ALTER TABLE profiles ADD COLUMN email_opt_out boolean NOT NULL DEFAULT false;

-- 2. Notification log (idempotency: one notification per event per application)
CREATE TABLE notification_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid    NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type  text        NOT NULL CHECK (event_type IN ('new_application', 'viewed', 'accepted', 'rejected')),
  recipient_id uuid      NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_notification_logs_idempotent
  ON notification_logs(application_id, event_type);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON notification_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

-- 3. Enable pg_net extension for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 4. Trigger function: fires on application INSERT or estado UPDATE,
--    posts a lightweight payload to the Edge Function via pg_net.
--    The Edge Function URL and service role key are stored as Supabase
--    Vault secrets (insert them once after deploying the function):
--
--    SELECT vault.create_secret(
--      'https://<ref>.supabase.co/functions/v1',
--      'edge_function_base_url'
--    );
--    SELECT vault.create_secret(
--      '<service_role_key>',
--      'supabase_service_role_key'
--    );

CREATE OR REPLACE FUNCTION notify_application_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  fn_url  text;
  svc_key text;
  payload jsonb;
  evt     text;
BEGIN
  -- Determine which event happened
  IF TG_OP = 'INSERT' THEN
    evt := 'new_application';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only fire on estado changes
    IF OLD.estado IS NOT DISTINCT FROM NEW.estado THEN
      RETURN NEW;
    END IF;
    CASE NEW.estado
      WHEN 'vista'     THEN evt := 'viewed';
      WHEN 'aceptada'  THEN evt := 'accepted';
      WHEN 'rechazada' THEN evt := 'rejected';
      ELSE RETURN NEW;
    END CASE;
  ELSE
    RETURN NEW;
  END IF;

  -- Read secrets from Vault (silently skip if not configured)
  BEGIN
    SELECT decrypted_secret INTO fn_url
      FROM vault.decrypted_secrets WHERE name = 'edge_function_base_url';
    SELECT decrypted_secret INTO svc_key
      FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  IF fn_url IS NULL OR svc_key IS NULL THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'event_type',     evt,
    'application_id', NEW.id,
    'candidato_id',   NEW.candidato_id,
    'job_id',         NEW.job_id,
    'estado',         NEW.estado
  );

  -- Fire-and-forget HTTP POST (pg_net is async, won't block the transaction)
  PERFORM net.http_post(
    url     := fn_url || '/notify-application',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body    := payload
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_application_change
  AFTER INSERT OR UPDATE OF estado ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_change();
