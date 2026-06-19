-- 20260616040000_pg_cron_retention.sql
-- TAREA #10: retención automática con pg_cron.
--
-- PROBLEMA
-- --------
-- Dos tablas crecen sin límite:
--   * job_events       (20260614140000_analytics.sql): un row por vista de vacante.
--   * job_view_dedup   (20260615020000_record_job_view_dedup.sql): un row por
--                       (usuario, job) con ventana de dedup de 30 min.
-- employer_analytics() y employer_daily_stats() hacen COUNT(*) sobre job_events;
-- sin retención, esos COUNT se degradan con el tiempo. job_view_dedup solo necesita
-- conservar filas dentro de la ventana de 30 min, así que cualquier fila de más de
-- 1 día es basura pura.
--
-- ENFOQUE
-- -------
-- pg_cron (vive en la BD postgres en Supabase, schema 'cron'). Dos jobs diarios:
--   1. Borrar job_events con created_at < now() - 180 days.
--   2. Borrar job_view_dedup con last_viewed_at < now() - 1 day (la ventana de
--      dedup es de 30 min; 1 día sobra de margen).
--
-- IDEMPOTENCIA
-- ------------
-- cron.schedule por nombre hace UPSERT (si el nombre ya existe, actualiza el job),
-- así que re-aplicar esta migración NO duplica jobs. Aun así, primero
-- desprogramamos por nombre dentro de un bloque tolerante a errores para empezar
-- siempre desde un estado limpio (cron.unschedule lanza si el job no existe).

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Desprogramar versiones previas por nombre (tolerante a "job no existe").
DO $$
BEGIN
  PERFORM cron.unschedule('retention_job_events');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('retention_job_view_dedup');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 1. job_events: conservar 180 días. Diario a las 03:10 (hora del servidor, UTC).
--    Evita la degradación de employer_analytics()/employer_daily_stats(), que
--    hacen COUNT(*) sobre esta tabla.
SELECT cron.schedule(
  'retention_job_events',
  '10 3 * * *',
  $job$DELETE FROM public.job_events WHERE created_at < now() - interval '180 days'$job$
);

-- 2. job_view_dedup: conservar 1 día (la ventana real de dedup es 30 min). Diario
--    a las 03:20 UTC. Mantiene la tabla auxiliar de dedup pequeña.
SELECT cron.schedule(
  'retention_job_view_dedup',
  '20 3 * * *',
  $job$DELETE FROM public.job_view_dedup WHERE last_viewed_at < now() - interval '1 day'$job$
);
