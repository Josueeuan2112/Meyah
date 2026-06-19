-- job_applicants_near: agregar candidato_avatar_path con gating de PII.
--
-- Decision de privacidad (ya tomada): el empleador NO ve la foto del candidato
-- durante el filtrado, solo tras ACEPTAR la postulacion. Esto evita sesgo por
-- apariencia en la criba. Mismo gating exacto que candidato_phone.
--
-- El PATH crudo de profiles.avatar_path se devuelve tal cual; el frontend
-- reconstruye la URL publica con getPublicUrl (bucket publico 'avatars').
--
-- La RETURNS TABLE cambia de firma (columna nueva), por lo que PostgreSQL
-- obliga a DROP + RECREATE; CREATE OR REPLACE no permite alterar el tipo de
-- retorno in-place.

DROP FUNCTION IF EXISTS public.job_applicants_near(uuid);

CREATE OR REPLACE FUNCTION public.job_applicants_near(p_job_id uuid)
 RETURNS TABLE(
   id uuid,
   candidato_id uuid,
   estado application_status,
   mensaje text,
   created_at timestamp with time zone,
   viewed_at timestamp with time zone,
   candidato_nombre text,
   candidato_phone text,
   candidato_avatar_path text,
   cv_path text,
   distancia_m double precision
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Guard de ownership: solo el empleador que posee el job puede llamarla.
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.companies c ON c.id = j.company_id
    WHERE j.id = p_job_id
      AND c.owner_id = auth.uid()
      AND j.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'access denied: you do not own this job';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.candidato_id,
    a.estado,
    a.mensaje,
    a.created_at,
    a.viewed_at,
    p.nombre    AS candidato_nombre,
    -- S2: telefono solo visible tras aceptacion.
    CASE
      WHEN a.estado = 'aceptada'::application_status THEN p.phone
      ELSE NULL
    END         AS candidato_phone,
    -- Avatar solo visible tras aceptacion (mismo gating que el telefono):
    -- evita sesgo por apariencia durante el filtrado. PATH crudo, no URL.
    CASE
      WHEN a.estado = 'aceptada'::application_status THEN p.avatar_path
      ELSE NULL
    END         AS candidato_avatar_path,
    -- CV siempre visible (decision de producto).
    p.cv_path,
    -- El empleador ve la DISTANCIA, nunca las coordenadas exactas.
    CASE
      WHEN j.location IS NOT NULL
       AND p.lat_referencia IS NOT NULL
       AND p.lng_referencia IS NOT NULL
      THEN st_distance(
             j.location,
             st_setsrid(st_makepoint(p.lng_referencia, p.lat_referencia), 4326)::geography
           )
      ELSE NULL
    END AS distancia_m
  FROM public.applications a
  JOIN public.jobs j     ON j.id = a.job_id
  JOIN public.profiles p ON p.id = a.candidato_id
  WHERE a.job_id = p_job_id
    AND a.deleted_at IS NULL
  ORDER BY distancia_m ASC NULLS LAST, a.created_at DESC;
END;
$function$;

COMMENT ON FUNCTION public.job_applicants_near(uuid) IS
  'Lista postulantes de un job (solo el empleador dueno). PII con gating: '
  'telefono y avatar_path solo se exponen cuando la postulacion esta aceptada; '
  'coordenadas nunca (solo distancia). SECURITY DEFINER con guard de ownership.';

-- DROP elimina los grants previos: restaurarlos explicitamente.
-- Solo authenticated necesita ejecutarla (el guard de ownership la protege).
REVOKE ALL ON FUNCTION public.job_applicants_near(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.job_applicants_near(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.job_applicants_near(uuid) TO service_role;
