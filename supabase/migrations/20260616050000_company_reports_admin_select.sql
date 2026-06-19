-- 20260616050000_company_reports_admin_select.sql
-- TAREA #15: dar a los admins lectura de company_reports (habilitar moderación).
--
-- PROBLEMA
-- --------
-- company_reports (20260615063000) se creó SOLO con policy de INSERT. Con RLS
-- habilitado y sin ninguna policy de SELECT, ningún rol authenticated puede leer
-- los reportes: no hay flujo de moderación posible salvo service_role.
--
-- ENFOQUE
-- -------
-- Replicar EXACTAMENTE el patrón de message_reports y review_reports
-- (20260614160000_v2_security_hardening.sql), que tienen DOS policies de SELECT:
--   * el reportante lee su propio reporte (auth.uid() = reporter_id)
--   * los admins leen todos (auth.uid() IN (SELECT user_id FROM public.admins))
--
-- NO se toca el envío de correo (depende de SMTP, pospuesto). Esto es solo lectura.

-- El reportante puede leer su propio reporte (igual que message_reports /
-- review_reports exponen al reportante su propio reporte).
CREATE POLICY "reporters_read_own_company_reports"
  ON public.company_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Los admins leen todos los reportes para moderar empresas.
CREATE POLICY "admins_read_all_company_reports"
  ON public.company_reports FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admins));
