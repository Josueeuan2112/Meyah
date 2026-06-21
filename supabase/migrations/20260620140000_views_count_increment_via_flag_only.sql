-- 20260620140000_views_count_increment_via_flag_only.sql
-- Cierra el self-PATCH de views_count (+1) por un no-admin.
--
-- Estado previo (C1, 20260620000000_jobs_field_immutability.sql):
--   El trigger prevent_job_field_tampering permitia a un no-admin cambiar
--   views_count siempre que NEW = OLD + 1. Como el dueno de la vacante tiene
--   UPDATE por RLS sobre su propio job, podia hacer en bucle
--     UPDATE jobs SET views_count = views_count + 1 WHERE id = <suyo>
--   inflando el contador sin pasar por dedup ni owner-skip.
--   Reproducido: dueno (no-admin) 2x PATCH +1 directo -> views_count 0 -> 2.
--
-- Solucion: el unico camino legitimo que incrementa views_count es
-- record_job_view (SECURITY DEFINER, con dedup de 30 min y owner-skip).
-- Usamos una bandera transaccional (set_config local) que solo record_job_view
-- enciende justo antes de su UPDATE:
--   current_setting('meyah.allow_view_increment', true) = 'on'
-- El segundo arg (true) de current_setting evita error si la GUC no esta
-- seteada (devuelve NULL). set_config(..., true) la hace LOCAL a la transaccion,
-- asi que no se filtra entre transacciones ni hace falta resetearla.
--
-- Para un no-admin, cualquier cambio de views_count SIN la bandera se rechaza.
-- El resto del trigger C1 se preserva intacto (is_featured / featured_until /
-- slug / company_id / created_at inmutables; expires_at <= now()+60d y solo si
-- cambia, posterior a created_at).
--
-- Definicion vigente de prevent_job_field_tampering recuperada con
-- pg_get_functiondef (20260620000000). Solo cambia el bloque de views_count.

create or replace function public.prevent_job_field_tampering()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_admin boolean := auth.uid() in (select user_id from public.admins);
begin
  -- Los admins (y la futura RPC de renovacion v3 que correra como admin)
  -- no tienen restriccion.
  if is_admin then
    return new;
  end if;

  -- ------------------------------------------------------------------
  -- Campos reservados al sistema/admin: monetizacion, identidad, contadores.
  -- Cualquier cambio por un no-admin se rechaza.
  -- ------------------------------------------------------------------
  if new.is_featured is distinct from old.is_featured then
    raise exception 'jobs.is_featured solo lo maneja el sistema/admin';
  end if;
  if new.featured_until is distinct from old.featured_until then
    raise exception 'jobs.featured_until solo lo maneja el sistema/admin';
  end if;
  if new.slug is distinct from old.slug then
    raise exception 'jobs.slug es inmutable';
  end if;
  if new.company_id is distinct from old.company_id then
    raise exception 'jobs.company_id es inmutable';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'jobs.created_at es inmutable';
  end if;

  -- ------------------------------------------------------------------
  -- views_count: solo record_job_view puede cambiarlo. Esa RPC enciende la
  -- bandera transaccional meyah.allow_view_increment justo antes de su UPDATE.
  -- Sin la bandera, cualquier cambio de views_count por un no-admin se rechaza
  -- (incluido el +1 directo via PATCH, que antes pasaba).
  -- ------------------------------------------------------------------
  if new.views_count is distinct from old.views_count
     and coalesce(current_setting('meyah.allow_view_increment', true), 'off') <> 'on' then
    raise exception 'jobs.views_count solo lo incrementa record_job_view';
  end if;

  -- ------------------------------------------------------------------
  -- expires_at: un no-admin no puede fijarlo a futuro arbitrario.
  -- Se permite re-publicar/extender solo dentro de un tope de 60 dias desde
  -- ahora, y nunca en/antes de created_at. La renovacion "real" de v3 ira por
  -- una RPC controlada (SECURITY DEFINER) que correra fuera de esta restriccion.
  -- ------------------------------------------------------------------
  if new.expires_at is distinct from old.expires_at then
    if new.expires_at > now() + interval '60 days' then
      raise exception 'jobs.expires_at no puede exceder 60 dias desde ahora';
    end if;
    if new.expires_at <= new.created_at then
      raise exception 'jobs.expires_at debe ser posterior a created_at';
    end if;
  end if;

  return new;
end;
$$;

-- ====================================================================
-- record_job_view: enciende la bandera meyah.allow_view_increment (local a la
-- transaccion) ANTES del UPDATE de views_count, para que el trigger C1 permita
-- ese unico incremento legitimo. El resto de la funcion se preserva integro
-- (owner-skip, validacion de vacante activa, dedup sha256 de 30 min, evento).
--
-- Definicion vigente recuperada con pg_get_functiondef
-- (20260620050000_record_job_view_skip_owner.sql).
-- ====================================================================

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

  -- Encender la bandera transaccional (LOCAL) que autoriza el unico incremento
  -- legitimo de views_count en el trigger prevent_job_field_tampering.
  perform set_config('meyah.allow_view_increment', 'on', true);

  update public.jobs
  set views_count = coalesce(views_count, 0) + 1
  where id = p_job_id and deleted_at is null;
end;
$function$;
