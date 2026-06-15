-- 20260615050000_messages_read_at_immutability.sql
--
-- S6: read_at de mensajes forjable a un timestamp arbitrario.
--
-- PROBLEMA
-- --------
-- El trigger prevent_message_mutation protege id/sender_id/conversation_id/body/
-- created_at, pero NO read_at. La policy "Recipient marks messages read" solo
-- exige que read_at IS NOT NULL en el UPDATE, asi que el destinatario podia:
--   * poner read_at a un timestamp arbitrario (pasado o futuro),
--   * cambiar read_at una vez ya marcado,
--   * (con un UPDATE que ponga otra columna) intentar revertir read_at a NULL.
-- Esto corrompe la semantica de "leido" y los indicadores de no-leidos.
--
-- FIX
-- ---
-- Endurecer prevent_message_mutation (CREATE OR REPLACE) para que read_at:
--   * solo pueda pasar de NULL -> valor (marcar como leido una sola vez),
--   * no pueda revertirse a NULL,
--   * no pueda cambiarse una vez puesto,
--   * no acepte timestamps absurdos (futuro, ni anterior a created_at).
-- Se preservan TODAS las validaciones existentes (id/sender/conversation/body/
-- created_at). El trigger trg_message_immutability ya esta asociado a la tabla,
-- no se recrea.
--
-- No cambia ninguna firma ni forma de tabla -> gen:types no cambia.

CREATE OR REPLACE FUNCTION public.prevent_message_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Columnas inmutables existentes.
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'id is immutable';
  END IF;
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'sender_id is immutable';
  END IF;
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
    RAISE EXCEPTION 'conversation_id is immutable';
  END IF;
  IF NEW.body IS DISTINCT FROM OLD.body THEN
    RAISE EXCEPTION 'body is immutable';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'created_at is immutable';
  END IF;

  -- read_at: solo NULL -> valor, una sola vez, sin revertir ni reescribir.
  IF OLD.read_at IS NOT NULL THEN
    -- Ya estaba marcado: read_at es inmutable a partir de ahi.
    IF NEW.read_at IS DISTINCT FROM OLD.read_at THEN
      RAISE EXCEPTION 'read_at is immutable once set';
    END IF;
  ELSIF NEW.read_at IS NOT NULL THEN
    -- Transicion NULL -> valor (marcar como leido). El SERVIDOR impone el
    -- timestamp con now(), ignorando el valor que mande el cliente. Esto:
    --   * elimina la falsificacion de read_at (cualquier valor del cliente se
    --     sobrescribe), y
    --   * evita errores cuando el reloj del dispositivo esta desincronizado
    --     (no se valida contra el reloj del cliente, se reemplaza).
    NEW.read_at := now();
  END IF;

  RETURN NEW;
END;
$$;
