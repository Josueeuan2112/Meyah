-- 20260615063000_company_reports.sql
-- V2 — Reportar empresa. Espejo EXACTO del patrón de message_reports
-- (20260614110000_chat_system.sql):
--   * id uuid pk, FK al objeto reportado, reporter_id FK profiles, reason
--     text CHECK char_length(reason) BETWEEN 1 AND 500, created_at, UNIQUE
--     (objeto, reporter) anti-spam.
--   * RLS: SOLO policy de INSERT (el reportante inserta su propio reporte).
--     message_reports NO tiene policy de SELECT -> con RLS habilitado, ningún
--     rol 'authenticated' puede leer los reportes; los admins los consultan vía
--     service role / dashboard. Replicamos ese mismo modelo para no abrir una
--     superficie de lectura nueva. NO se agrega SELECT a authenticated.
--
-- gen:types CAMBIA (nueva tabla company_reports).

CREATE TABLE public.company_reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reporter_id uuid        NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  reason      text        NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Anti-spam: un reportante solo puede reportar una vez la misma empresa.
  CONSTRAINT uq_report_per_company UNIQUE (company_id, reporter_id)
);

ALTER TABLE public.company_reports ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.company_reports IS 'Reportes de abuso sobre empresas. Espejo de message_reports: solo INSERT por el reportante; sin policy de SELECT (admins leen vía service role). UNIQUE (company_id, reporter_id) evita spam.';

-- INSERT: cualquier authenticated reporta, pero solo su propio reporte
-- (auth.uid() = reporter_id) y solo contra una empresa existente no borrada.
-- (message_reports valida además que el reportante sea participante del chat;
--  aquí el equivalente razonable es que la empresa exista y esté activa, ya que
--  el perfil de empresa es público y cualquier usuario logueado puede reportar.)
CREATE POLICY "Users report companies"
  ON public.company_reports FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id
        AND c.deleted_at IS NULL
    )
  );

-- NOTA seguridad: igual que message_reports, NO existe policy de SELECT para
-- authenticated. Los reportes solo se leen con service role (panel admin / job
-- de moderación). Esto evita que un atacante enumere quién reportó a quién.
