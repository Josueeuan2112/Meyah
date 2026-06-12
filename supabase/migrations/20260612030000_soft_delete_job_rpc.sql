-- Auditoría: useDeleteJob hacía el soft-delete en DOS updates desde el cliente
-- (applications primero, luego el job). Si el segundo fallaba (red, sesión
-- expirada a media operación), quedaban postulaciones marcadas como borradas
-- con la vacante viva — estado corrupto irreversible desde la UI.
-- Esta RPC ejecuta ambos updates en UNA transacción (toda función corre en
-- transacción única en Postgres): o se marcan los dos, o ninguno.
--
-- SECURITY INVOKER deliberado: la RLS sigue mandando — jobs_update_owner y
-- applications_update_employer solo dejan pasar al dueño de la empresa del
-- job, así que un candidato (o un empleador ajeno) ejecuta esto y el update
-- simplemente afecta 0 filas en jobs → devolvemos false y no toca nada.

create or replace function public.soft_delete_job(p_job_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  job_marked integer;
begin
  -- El job primero: si la RLS no nos deja (no somos dueños / ya borrado),
  -- salimos sin tocar las postulaciones.
  update jobs
  set deleted_at = now()
  where id = p_job_id and deleted_at is null;

  get diagnostics job_marked = row_count;
  if job_marked = 0 then
    return false;
  end if;

  update applications
  set deleted_at = now()
  where job_id = p_job_id and deleted_at is null;

  return true;
end;
$$;

-- Grant mínimo (mismo criterio que function_hardening): nada para PUBLIC/anon
revoke execute on function public.soft_delete_job(uuid) from public, anon;
grant execute on function public.soft_delete_job(uuid) to authenticated;
