-- 20260608000000_applications_field_immutability.sql
-- Cierra dos huecos a nivel columna en applications:
--   (1) el candidato podía auto-asignarse estado (p.ej. 'aceptada')
--   (2) el empleador podía sobrescribir el mensaje del candidato
-- Causa raíz: RLS es a nivel FILA. La inmutabilidad por columna va en trigger.

create or replace function public.prevent_application_field_tampering()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_candidate boolean := auth.uid() = old.candidato_id;
begin
  -- Inmutables para cualquiera: una postulación no se reasigna a otra persona ni a otra vacante
  if new.candidato_id is distinct from old.candidato_id then
    raise exception 'applications.candidato_id es inmutable';
  end if;
  if new.job_id is distinct from old.job_id then
    raise exception 'applications.job_id es inmutable';
  end if;

  if is_candidate then
    -- El candidato NO toca los campos de revisión (dominio del empleador)
    if new.estado is distinct from old.estado then
      raise exception 'solo el empleador puede cambiar applications.estado';
    end if;
    if new.viewed_at is distinct from old.viewed_at then
      raise exception 'solo el empleador puede cambiar applications.viewed_at';
    end if;
    if new.responded_at is distinct from old.responded_at then
      raise exception 'solo el empleador puede cambiar applications.responded_at';
    end if;
  else
    -- El empleador NO reescribe el mensaje (contenido del candidato)
    if new.mensaje is distinct from old.mensaje then
      raise exception 'el empleador no puede modificar applications.mensaje';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_application_field_tampering on public.applications;

create trigger trg_prevent_application_field_tampering
before update on public.applications
for each row
execute function public.prevent_application_field_tampering();