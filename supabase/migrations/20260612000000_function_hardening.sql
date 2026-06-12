-- Endurecimiento de funciones (auditoría Etapa de seguridad):
--
-- (1) search_path fijo en las dos funciones de trigger que no lo tenían.
--     Son SECURITY INVOKER (riesgo bajo), pero fijarlo es gratis, cierra el
--     vector de secuestro de search_path y silencia el advisor de Supabase
--     (function_search_path_mutable). Las demás ya lo tenían.
--
-- (2) Grant execute mínimo: Postgres da EXECUTE a PUBLIC por default, así que
--     anon podía llamar todas las RPC. La más sensible: increment_job_views es
--     SECURITY DEFINER (bypassa RLS) — un bot sin login podía inflar contadores.
--     Se revoca PUBLIC/anon y se deja solo authenticated + service_role.
--     jobs_near se queda también para anon a propósito: solo expone vacantes
--     abiertas (mismo contenido que jobs_select_public_open permite a anon) y
--     habilita un futuro mapa público en el landing sin tocar la BD.

alter function public.prevent_profile_tipo_change() set search_path = public;
alter function public.sync_job_location() set search_path = public;

-- increment_job_views: solo usuarios autenticados (el front ya lo llama solo
-- con sesión de candidato)
revoke execute on function public.increment_job_views(uuid) from public, anon;

-- RPCs de empleador/candidato autenticado: nada que hacer ahí para anon
revoke execute on function public.job_applicants_near(uuid) from public, anon;
revoke execute on function public.my_jobs_applicant_proximity(double precision) from public, anon;

-- jobs_near: revocar PUBLIC (rol comodín) pero re-otorgar explícito a anon y
-- authenticated — queda documentado que anon es intencional, no default.
revoke execute on function public.jobs_near(double precision, double precision) from public;
grant execute on function public.jobs_near(double precision, double precision) to anon, authenticated;
