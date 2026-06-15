-- 20260615020000_record_job_view_dedup.sql
--
-- S3 / B1: record_job_view() sin dedup permite inflar views_count.
--
-- PROBLEMA
-- --------
-- La version vigente (20260615000000) elimino el dedup global por minuto porque
-- ese dedup descartaba vistas de usuarios DISTINTOS (era global por job, no por
-- usuario). Resultado: quedo SIN ningun dedup server-side -> cualquier cliente
-- autenticado puede llamar record_job_view() en bucle e inflar views_count
-- arbitrariamente.
--
-- RESTRICCION DE PRIVACIDAD
-- -------------------------
-- job_events NO debe guardar user_id en claro (decision de privacidad ya tomada).
-- Por eso no podemos deduplicar por usuario guardando su id en job_events.
--
-- ENFOQUE
-- -------
-- Tabla auxiliar de dedup (job_view_dedup) que guarda SOLO un hash irreversible
-- (SHA-256) derivado de (auth.uid() || ':' || job_id), mas la marca de tiempo de
-- la ultima vista. NO guarda user_id ni job_id en claro -> preserva la privacidad.
-- La irreversibilidad descansa en que tanto auth.uid() como job_id son UUIDs de
-- alta entropia, no enumerables (no se usa un pepper de servidor: aportaria poco
-- frente a este modelo de amenaza). La tabla se maneja EXCLUSIVAMENTE dentro de
-- la funcion DEFINER:
--   * RLS habilitada y SIN policies para authenticated/anon (nadie puede leer ni
--     escribir directamente; solo el codigo DEFINER, que corre como owner y
--     bypasa RLS, la toca).
-- Dedup por ventana de 30 minutos por (usuario, job): si ya existe una vista no
-- expirada para ese hash, NO se inserta evento ni se incrementa views_count. Si
-- la ventana expiro, se actualiza la marca y se cuenta de nuevo.
--
-- Asi varios usuarios distintos SI cuentan (hash distinto por usuario) y el mismo
-- usuario no puede inflar el contador con refrescos repetidos.
--
-- La firma de record_job_view(uuid) -> void NO cambia -> gen:types no cambia.


-- ============================================================
-- 1. Tabla auxiliar de dedup (privacy-preserving)
-- ============================================================
-- view_key: hash hex SHA-256 de (uid || ':' || job_id). Irreversible.
-- last_viewed_at: ultima vez que se conto una vista para esa clave.

CREATE TABLE IF NOT EXISTS public.job_view_dedup (
  view_key       text        PRIMARY KEY,
  last_viewed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS habilitada, SIN policies: ningun rol cliente puede leer/escribir. Solo la
-- funcion SECURITY DEFINER (que corre como owner) accede a esta tabla.
ALTER TABLE public.job_view_dedup ENABLE ROW LEVEL SECURITY;

-- Indice para la limpieza por antiguedad.
CREATE INDEX IF NOT EXISTS idx_job_view_dedup_last_viewed
  ON public.job_view_dedup (last_viewed_at);

REVOKE ALL ON TABLE public.job_view_dedup FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.job_view_dedup IS
  'Dedup server-side de vistas de vacantes. Guarda solo un hash irreversible de (usuario+job), nunca user_id en claro. Manejada exclusivamente por record_job_view() (SECURITY DEFINER).';


-- ============================================================
-- 2. record_job_view(): dedup por ventana de 30 min via hash
-- ============================================================
-- Mantiene: validacion de job existente/abierto, insert en job_events SIN
-- user_id, incremento de views_count. Agrega: dedup por (usuario, job) en 30 min.
-- Si no hay sesion (auth.uid() IS NULL) no se puede deduplicar por usuario; en
-- ese caso no se cuenta (la funcion solo se concede a authenticated, asi que en
-- la practica siempre hay uid).

CREATE OR REPLACE FUNCTION public.record_job_view(p_job_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_key      text;
  v_inserted boolean := false;
BEGIN
  -- Sin identidad no se puede deduplicar por usuario; no contamos.
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  -- Validar que la vacante existe y esta activa.
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = p_job_id
      AND deleted_at IS NULL
      AND estado = 'abierta'
  ) THEN
    RETURN;
  END IF;

  -- Clave de dedup: hash irreversible de (uid || job_id). El gen_random_uuid del
  -- propio job_id ya es secreto suficiente; encode(digest(...)) la vuelve
  -- opaca. NO se almacena uid ni job_id en claro.
  v_key := encode(
    extensions.digest(v_uid::text || ':' || p_job_id::text, 'sha256'),
    'hex'
  );

  -- Intentar registrar la clave. Si no existe (o existe pero expiro hace >30 min)
  -- contamos la vista. Si existe y esta dentro de la ventana, NO contamos.
  INSERT INTO public.job_view_dedup (view_key, last_viewed_at)
  VALUES (v_key, now())
  ON CONFLICT (view_key) DO UPDATE
    SET last_viewed_at = now()
    WHERE public.job_view_dedup.last_viewed_at < now() - INTERVAL '30 minutes'
  RETURNING true INTO v_inserted;

  -- v_inserted es true solo cuando hubo INSERT nuevo o UPDATE permitido por la
  -- ventana; es NULL cuando el ON CONFLICT no actualizo (vista duplicada).
  IF v_inserted IS NOT TRUE THEN
    RETURN;
  END IF;

  -- Vista valida: registrar evento (sin user_id) e incrementar contador.
  INSERT INTO public.job_events (job_id, event_type)
  VALUES (p_job_id, 'view');

  UPDATE public.jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id AND deleted_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_job_view(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_job_view(UUID) TO authenticated;
