-- 20260620030000_check_constraints.sql
-- M6 (MEDIO): CHECK constraints faltantes que cierran estados imposibles a
-- nivel BD (defensa en profundidad, independiente de la app/RLS).
--
-- Verificado contra datos reales antes de aplicar (0 filas en violacion):
--   conversations con candidato_id = empleador_id  -> 0
--   jobs con expires_at <= created_at              -> 0
--
-- Sobre la auto-resena: NO necesita CHECK. Es estructuralmente imposible.
-- reviews_insert_own_completed exige que el autor sea el CANDIDATO de una
-- application aceptada/rechazada de un job de esa company. El dueno de la
-- empresa tiene profiles.tipo = 'empleador' y nunca aparece como
-- applications.candidato_id de su propia vacante, asi que jamas puede
-- insertar una resena sobre su propia empresa. No se agrega constraint.

-- 1) Las dos partes de una conversacion deben ser distintas.
alter table public.conversations
  add constraint conversations_distinct_parties
  check (candidato_id <> empleador_id);

-- 2) Una vacante expira despues de haber sido creada.
alter table public.jobs
  add constraint jobs_expires_after_created
  check (expires_at > created_at);
