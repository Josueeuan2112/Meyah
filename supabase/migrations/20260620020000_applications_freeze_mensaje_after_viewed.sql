-- 20260620020000_applications_freeze_mensaje_after_viewed.sql
-- B1 (BAJO): congelar applications.mensaje una vez que el empleador ya lo vio.
--
-- Extiende prevent_application_field_tampering (20260608000000) sin tocar el
-- resto de su logica. Definicion original verificada con pg_get_functiondef:
-- guarda candidato_id/job_id inmutables, candidato no toca estado/viewed_at/
-- responded_at, empleador no toca mensaje. Aqui solo AGREGAMOS: si la
-- postulacion ya fue vista (viewed_at IS NOT NULL), el candidato tampoco puede
-- editar su mensaje (el empleador ya lo leyo; editarlo despues seria
-- "rescribir" lo que el empleador valoro).

create or replace function public.prevent_application_field_tampering()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_candidate boolean := auth.uid() = old.candidato_id;
begin
  -- Inmutables para cualquiera: una postulacion no se reasigna a otra persona ni a otra vacante
  if new.candidato_id is distinct from old.candidato_id then
    raise exception 'applications.candidato_id es inmutable';
  end if;
  if new.job_id is distinct from old.job_id then
    raise exception 'applications.job_id es inmutable';
  end if;

  if is_candidate then
    -- El candidato NO toca los campos de revision (dominio del empleador)
    if new.estado is distinct from old.estado then
      raise exception 'solo el empleador puede cambiar applications.estado';
    end if;
    if new.viewed_at is distinct from old.viewed_at then
      raise exception 'solo el empleador puede cambiar applications.viewed_at';
    end if;
    if new.responded_at is distinct from old.responded_at then
      raise exception 'solo el empleador puede cambiar applications.responded_at';
    end if;
    -- Una vez vista por el empleador, el mensaje queda congelado.
    if old.viewed_at is not null and new.mensaje is distinct from old.mensaje then
      raise exception 'no se puede editar applications.mensaje despues de ser vista por el empleador';
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
