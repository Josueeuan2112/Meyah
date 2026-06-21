-- 20260620100000_conversations_deleted_at_soft_delete_cascade.sql
-- Segundo pase backend: cerrar el patrón "soft-delete que NO cascadea".
--
-- PROBLEMA RAÍZ
-- ------------
-- Borrar una empresa/vacante por soft-delete (deleted_at) NO propaga. Las
-- conversaciones quedaban "zombie": al no existir columna deleted_at en
-- conversations, una conversación de un job borrado seguía leyéndose y, peor,
-- aceptaba mensajes nuevos. Aquí:
--   1. Añadimos conversations.deleted_at (nullable; NULL = activa).
--   2. Extendemos soft_delete_job para también marcar las conversations del job.
--   3. Creamos soft_delete_company que cascadea empresa -> jobs -> applications
--      -> conversations en UNA transacción.
--
-- DECISIÓN INVOKER vs DEFINER (justificada con la RLS real verificada en vivo)
-- ---------------------------------------------------------------------------
-- conversations NO tiene NINGUNA policy de UPDATE (solo SELECT participantes e
-- INSERT). Bajo SECURITY INVOKER, un UPDATE a conversations.deleted_at afecta 0
-- filas (RLS lo niega), así que la cascada a conversations fallaría en silencio.
-- Dos caminos: (A) agregar una policy UPDATE a conversations — amplía superficie
-- (un participante podría tocar columnas arbitrarias del hilo); (B) DEFINER con
-- guard de ownership explícito en el cuerpo. Elegimos (B): NO ampliamos la
-- superficie de UPDATE directo del cliente sobre conversations, y el guard
-- (owner_id = auth.uid()) replica exactamente la autorización que antes daba la
-- RLS. soft_delete_job pasa de INVOKER a DEFINER por el mismo motivo (necesita
-- tocar conversations); se le añade el guard de ownership equivalente al que la
-- RLS aplicaba (jobs_update_owner: dueño de la empresa del job).

-- ============================================================
-- 1. Columna conversations.deleted_at (NULL = activa)
-- ============================================================
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.conversations.deleted_at IS
  'Soft-delete de la conversación. NULL = activa. Se setea en cascada al borrar el job (soft_delete_job) o la empresa (soft_delete_company). Mientras esté seteada no se pueden enviar mensajes nuevos (policy "Participants send messages").';

-- Índice parcial: las queries de chat solo miran conversaciones activas.
CREATE INDEX IF NOT EXISTS idx_conversations_active
  ON public.conversations (id)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 2. soft_delete_job: extender a conversations (INVOKER -> DEFINER)
-- ============================================================
-- Definición REAL leída en vivo (pg_get_functiondef): INVOKER, search_path
-- public, marca jobs y applications. Se preservan ambos updates y el contrato
-- de retorno (false si no es dueño / job ya borrado, true si marcó). Se añade:
--   * Guard de ownership explícito al inicio (antes lo daba la RLS via INVOKER;
--     ahora con DEFINER hay que comprobarlo a mano: dueño de la empresa del job).
--   * UPDATE de las conversations del job (WHERE job_id = p_job_id).
CREATE OR REPLACE FUNCTION public.soft_delete_job(p_job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  job_marked integer;
begin
  -- Guard de ownership (reemplaza la autorización que antes daba la RLS bajo
  -- INVOKER): solo el dueño de la empresa del job puede borrarlo, y solo si el
  -- job sigue vivo. Si no aplica, salimos sin tocar nada -> false.
  update jobs j
  set deleted_at = now()
  where j.id = p_job_id
    and j.deleted_at is null
    and exists (
      select 1 from companies c
      where c.id = j.company_id
        and c.owner_id = auth.uid()
    );

  get diagnostics job_marked = row_count;
  if job_marked = 0 then
    return false;
  end if;

  -- Postulaciones del job.
  update applications
  set deleted_at = now()
  where job_id = p_job_id and deleted_at is null;

  -- Conversaciones del job (cierra el hilo zombie: ya no se puede enviar).
  update conversations
  set deleted_at = now()
  where job_id = p_job_id and deleted_at is null;

  return true;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_job(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.soft_delete_job(uuid) TO authenticated;

COMMENT ON FUNCTION public.soft_delete_job(uuid) IS
  'Soft-delete atómico de una vacante y su cascada: marca deleted_at en el job, sus applications y sus conversations. SECURITY DEFINER con guard explícito (dueño de la empresa del job) porque conversations no tiene policy de UPDATE. Devuelve false si el llamante no es dueño o el job ya estaba borrado.';

-- ============================================================
-- 3. soft_delete_company: cascada completa empresa -> todo
-- ============================================================
-- SECURITY DEFINER con guard de ownership explícito (owner_id = auth.uid()).
-- DEFINER porque debe tocar conversations (sin policy de UPDATE) y porque
-- centraliza la cascada en una sola transacción atómica. El guard inicial corta
-- a cualquiera que no sea el dueño de la empresa ANTES de tocar nada.
CREATE OR REPLACE FUNCTION public.soft_delete_company(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  company_marked integer;
begin
  -- Guard de ownership: solo el dueño puede borrar su empresa, y solo si sigue
  -- viva. Si no aplica, 0 filas -> false y no se toca nada más.
  update companies
  set deleted_at = now()
  where id = p_company_id
    and deleted_at is null
    and owner_id = auth.uid();

  get diagnostics company_marked = row_count;
  if company_marked = 0 then
    return false;
  end if;

  -- Vacantes de la empresa.
  update jobs
  set deleted_at = now()
  where company_id = p_company_id and deleted_at is null;

  -- Postulaciones de esas vacantes.
  update applications
  set deleted_at = now()
  where deleted_at is null
    and job_id in (select id from jobs where company_id = p_company_id);

  -- Conversaciones: las "de vacante" (vía job de la empresa) y las "de empresa"
  -- (company_id directo). El XOR de conversations garantiza que una fila cae en
  -- exactamente una de las dos ramas, pero el OR las cubre ambas sin solaparse.
  update conversations co
  set deleted_at = now()
  where co.deleted_at is null
    and (
      co.company_id = p_company_id
      or co.job_id in (select id from jobs where company_id = p_company_id)
    );

  return true;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_company(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.soft_delete_company(uuid) TO authenticated;

COMMENT ON FUNCTION public.soft_delete_company(uuid) IS
  'Soft-delete atómico de una empresa y su cascada completa: marca deleted_at en la empresa, sus jobs, las applications de esos jobs, y las conversations (de vacante y de empresa). SECURITY DEFINER con guard explícito (owner_id = auth.uid()). Devuelve false si el llamante no es dueño o la empresa ya estaba borrada.';
