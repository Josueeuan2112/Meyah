-- 20260616070000_revoke_anon_job_applicants_near.sql
--
-- Hardening (defensa en profundidad) detectado en la auditoría de seguridad.
--
-- `public.job_applicants_near(uuid)` es la RPC SECURITY DEFINER que devuelve PII
-- del candidato (nombre, y teléfono/avatar tras aceptación, cv_path) al empleador
-- DUEÑO del job. Su recreación previa (DROP + CREATE en 20260616020000) hizo
-- `REVOKE ALL FROM PUBLIC` + `GRANT ... TO authenticated, service_role`, pero un
-- grant a `anon` sobreviviente de un overload anterior NO se limpió: `anon`
-- quedó con EXECUTE.
--
-- Hoy NO es explotable: el guard interno `c.owner_id = auth.uid()` hace
-- RAISE EXCEPTION y `auth.uid()` es NULL para anónimos, así que la llamada
-- siempre falla con "access denied". Pero el grant no debería existir: es
-- exactamente la superficie que un bug futuro (relajar el guard) convertiría en
-- fuga total de PII. Lo revocamos para que la frontera coincida con la intención
-- documentada ("solo authenticated").

REVOKE EXECUTE ON FUNCTION public.job_applicants_near(uuid) FROM anon;
