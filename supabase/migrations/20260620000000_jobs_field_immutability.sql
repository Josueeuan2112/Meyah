-- 20260620000000_jobs_field_immutability.sql
-- C1 (CRITICO): inmutabilidad por COLUMNA en public.jobs.
--
-- Causa raiz: la RLS es a nivel FILA, no COLUMNA. Un empleador dueno de la
-- vacante pasa el USING/WITH CHECK de la policy de UPDATE y puede hacer
--   PATCH /rest/v1/jobs?id=eq.<id>  { "is_featured": true, "views_count": 99999, ... }
-- y escribir campos que el sistema/admin/monetizacion deberian controlar,
-- aunque el editor del frontend no los muestre.
--
-- Patron tomado de prevent_application_field_tampering (20260608000000):
-- BEFORE UPDATE que compara OLD vs NEW y hace RAISE EXCEPTION si un no-admin
-- toca un campo reservado.
--
-- views_count y record_job_view:
--   record_job_view (SECURITY DEFINER, owner=postgres) incrementa views_count
--   en +1, pero auth.uid() dentro del trigger SIGUE siendo el del candidato
--   llamante (el claim del JWT cruza el limite de SECURITY DEFINER), NO un
--   admin. Si bloquearamos todo cambio de views_count para no-admins,
--   romperiamos el contador. Enfoque elegido (simple y robusto): permitir el
--   cambio de views_count SOLO cuando NEW = OLD + 1 (incremento atomico de +1,
--   la unica firma que produce record_job_view). Esto rechaza fijar un valor
--   arbitrario (p.ej. 99999) y rechaza decrementarlo; un no-admin nunca puede
--   "saltar" el contador. Repetir +1 via PATCH no es peor que llamar
--   record_job_view en bucle (que ademas deduplica por 30 min).
--   No se compara "campo unico que cambia" porque set_jobs_updated_at corre
--   antes que este trigger y ya pudo bumpear updated_at, lo que haria fragil
--   esa comparacion; el invariante NEW=OLD+1 es suficiente.
--
-- applications_count NO existe como columna en jobs (verificado contra el
-- esquema real), por eso NO se incluye en la guarda.

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
  -- views_count: solo el incremento +1 de record_job_view.
  -- ------------------------------------------------------------------
  if new.views_count is distinct from old.views_count
     and new.views_count <> coalesce(old.views_count, 0) + 1 then
    raise exception 'jobs.views_count solo lo incrementa record_job_view (+1)';
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

drop trigger if exists trg_prevent_job_field_tampering on public.jobs;

create trigger trg_prevent_job_field_tampering
before update on public.jobs
for each row
execute function public.prevent_job_field_tampering();
