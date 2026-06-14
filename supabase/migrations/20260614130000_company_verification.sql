-- 20260614130000_company_verification.sql
-- Feature 2.5: Company Verification Badge
--
-- Introduce la infraestructura para que un admin pueda verificar empresas:
--   (1) Tabla admins con RLS restrictivo (solo admins leen)
--   (2) RPC verify_company() — SECURITY DEFINER, solo admins
--   (3) Trigger de inmutabilidad: un empleador NO puede tocar is_verified/verified_at
--   (4) Policy para que admins puedan hacer UPDATE directo en companies (verificación)

-- ============================================================
-- 1. TABLA: admins
-- ============================================================

CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Solo los admins pueden leer la tabla de admins
CREATE POLICY "admins_select_self"
  ON public.admins FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT a.user_id FROM public.admins a));

COMMENT ON TABLE public.admins IS 'Usuarios con rol de administrador. Solo admins pueden leer esta tabla.';

-- ============================================================
-- 2. RPC: verify_company(p_company_id, p_verified)
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_company(p_company_id UUID, p_verified BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar que el caller es admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'solo administradores pueden verificar empresas';
  END IF;

  UPDATE public.companies
  SET
    is_verified = p_verified,
    verified_at = CASE WHEN p_verified THEN NOW() ELSE NULL END
  WHERE id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'empresa no encontrada: %', p_company_id;
  END IF;
END;
$$;

-- Revocar acceso público por default y otorgar solo a authenticated
REVOKE EXECUTE ON FUNCTION public.verify_company(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_company(UUID, BOOLEAN) TO authenticated;

-- ============================================================
-- 3. TRIGGER: impedir que no-admins modifiquen is_verified / verified_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_verification_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Si is_verified o verified_at cambian, solo un admin puede hacerlo
  IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified)
     OR (NEW.verified_at IS DISTINCT FROM OLD.verified_at) THEN

    IF NOT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) THEN
      RAISE EXCEPTION 'solo administradores pueden modificar is_verified y verified_at';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_verification_tampering
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_verification_tampering();

-- ============================================================
-- 4. RLS: admins pueden hacer UPDATE en companies (para verificar)
-- ============================================================
-- La policy existente "companies_update_own" solo permite al owner.
-- Esta policy adicional permite que un admin haga UPDATE (via RPC o directo).

CREATE POLICY "Admins verify companies"
  ON public.companies FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT a.user_id FROM public.admins a))
  WITH CHECK (auth.uid() IN (SELECT a.user_id FROM public.admins a));
