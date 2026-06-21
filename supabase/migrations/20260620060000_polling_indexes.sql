-- 20260620060000_polling_indexes.sql
-- M9 (escala): indices de soporte para los RPC/queries que el frontend ejecuta
-- por polling cada ~60s (conteo de postulaciones por estado y conteo de
-- mensajes no leidos). Indices parciales para mantenerlos chicos y alineados
-- al filtro real.
--
-- Columnas verificadas contra el esquema real:
--   applications(job_id, estado, deleted_at)
--   messages(conversation_id, sender_id, read_at)

create index if not exists idx_applications_job_estado
  on public.applications (job_id, estado)
  where deleted_at is null;

create index if not exists idx_messages_unread
  on public.messages (conversation_id, sender_id)
  where read_at is null;
