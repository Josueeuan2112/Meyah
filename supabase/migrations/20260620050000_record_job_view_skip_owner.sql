-- 20260620050000_record_job_view_skip_owner.sql
-- M5 (MEDIO): record_job_view no debe contar la vista del propio dueno de la
-- empresa (un empleador viendo su vacante en el panel inflaria su views_count).
--
-- Definicion original recuperada con pg_get_functiondef. Se preserva integra
-- (validacion de vacante activa, dedup de 30 min por hash sha256, registro en
-- job_events e incremento atomico de views_count). Solo se AGREGA, justo
-- despues de resolver auth.uid(), un RETURN temprano si el llamante es el dueno
-- de la empresa de la vacante.

create or replace function public.record_job_view(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid      uuid := auth.uid();
  v_key      text;
  v_inserted boolean := false;
begin
  -- Sin identidad no se puede deduplicar por usuario; no contamos.
  if v_uid is null then
    return;
  end if;

  -- El dueno de la empresa no genera vistas sobre sus propias vacantes.
  if exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = p_job_id
      and c.owner_id = v_uid
  ) then
    return;
  end if;

  -- Validar que la vacante existe y esta activa.
  if not exists (
    select 1 from public.jobs
    where id = p_job_id
      and deleted_at is null
      and estado = 'abierta'
  ) then
    return;
  end if;

  -- Clave de dedup: hash irreversible de (uid || job_id). El gen_random_uuid del
  -- propio job_id ya es secreto suficiente; encode(digest(...)) la vuelve
  -- opaca. NO se almacena uid ni job_id en claro.
  v_key := encode(
    extensions.digest(v_uid::text || ':' || p_job_id::text, 'sha256'),
    'hex'
  );

  -- Intentar registrar la clave. Si no existe (o existe pero expiro hace >30 min)
  -- contamos la vista. Si existe y esta dentro de la ventana, NO contamos.
  insert into public.job_view_dedup (view_key, last_viewed_at)
  values (v_key, now())
  on conflict (view_key) do update
    set last_viewed_at = now()
    where public.job_view_dedup.last_viewed_at < now() - interval '30 minutes'
  returning true into v_inserted;

  -- v_inserted es true solo cuando hubo INSERT nuevo o UPDATE permitido por la
  -- ventana; es NULL cuando el ON CONFLICT no actualizo (vista duplicada).
  if v_inserted is not true then
    return;
  end if;

  -- Vista valida: registrar evento (sin user_id) e incrementar contador.
  insert into public.job_events (job_id, event_type)
  values (p_job_id, 'view');

  update public.jobs
  set views_count = coalesce(views_count, 0) + 1
  where id = p_job_id and deleted_at is null;
end;
$function$;
