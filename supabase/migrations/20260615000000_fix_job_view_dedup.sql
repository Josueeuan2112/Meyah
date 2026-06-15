-- 20260615000000_fix_job_view_dedup.sql
-- Fix: record_job_view no contaba vistas de usuarios distintos.
--
-- El dedup anterior era GLOBAL por vacante: si cualquier usuario veía la
-- vacante en el último minuto, la vista de cualquier OTRO usuario se
-- descartaba. Resultado: una vacante registraba como máximo ~1 vista por
-- minuto sin importar cuánta gente la abriera.
--
-- job_events no guarda user_id (decisión de privacidad), así que no se puede
-- deduplicar por usuario en el servidor. El anti-spam por refresco rápido ya
-- lo cubre el Set de sesión del frontend (JobDetailView), que además maneja el
-- doble-montaje de StrictMode. Por eso aquí se elimina el dedup global y se
-- conserva solo la validación de que la vacante existe y está abierta.

CREATE OR REPLACE FUNCTION public.record_job_view(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validar que la vacante existe y está activa
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = p_job_id
      AND deleted_at IS NULL
      AND estado = 'abierta'
  ) THEN
    RETURN;
  END IF;

  -- Insertar evento de vista
  INSERT INTO public.job_events (job_id, event_type)
  VALUES (p_job_id, 'view');

  -- Incrementar contador (backward compat con views_count)
  UPDATE public.jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id AND deleted_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_job_view(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_job_view(UUID) TO authenticated;
