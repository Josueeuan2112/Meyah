-- 20260615060000_companies_profile_fields.sql
-- V2 — Re-skin + perfil público de empresa: campos del perfil de empresa.
--
-- Agrega columnas descriptivas/operativas a public.companies para el perfil
-- público. Todas nullable (las empresas existentes no las tienen) salvo los
-- arrays, que son NOT NULL DEFAULT '{}' para evitar manejar NULL en el frontend.
--
-- AUTORIZACION (sin cambios de policy): el owner ya puede UPDATE sus columnas
-- via "companies_update_own" (auth.uid() = owner_id). El trigger
-- trg_prevent_verification_tampering sigue impidiendo que un no-admin toque
-- is_verified/verified_at. NINGUNA de estas columnas nuevas necesita policy
-- extra: caen bajo la policy de UPDATE del owner y la de SELECT public.
--
-- LECTURA: "companies_select_public" expone la fila completa de companies a
-- anon+authenticated cuando deleted_at IS NULL. Estos campos son datos del
-- NEGOCIO (no PII de persona): correo empresarial, telefono de la empresa,
-- redes, historia, etc. Su exposicion publica es intencional (perfil publico).
--
-- gen:types CAMBIA tras esta migracion (nuevas columnas en companies).

-- ============================================================
-- Datos legales / contacto del negocio
-- ============================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS razon_social text,
  ADD COLUMN IF NOT EXISTS correo       text,
  ADD COLUMN IF NOT EXISTS telefono     text,
  ADD COLUMN IF NOT EXISTS categoria    text,
  ADD COLUMN IF NOT EXISTS tamano       text,
  ADD COLUMN IF NOT EXISTS historia     text,
  ADD COLUMN IF NOT EXISTS mision       text,
  ADD COLUMN IF NOT EXISTS vision       text,
  ADD COLUMN IF NOT EXISTS valores      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS beneficios   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS radio_km     int,
  ADD COLUMN IF NOT EXISTS horarios     jsonb,
  ADD COLUMN IF NOT EXISTS instagram    text,
  ADD COLUMN IF NOT EXISTS facebook     text,
  ADD COLUMN IF NOT EXISTS linkedin     text,
  ADD COLUMN IF NOT EXISTS x            text,
  ADD COLUMN IF NOT EXISTS tiktok       text;

-- ============================================================
-- CHECK constraints (defensa server-side, espejo de la validacion Zod del
-- cliente). Se agregan con guard idempotente porque ADD CONSTRAINT no soporta
-- IF NOT EXISTS en versiones de Postgres del proyecto.
-- ============================================================
DO $$
BEGIN
  -- categoria: lista cerrada del diseño de empresas (permite NULL).
  -- Distinta de jobs_categoria_check: esa es la taxonomia de vacantes; esta es
  -- el giro/industria de la EMPRESA (no existia un CHECK previo para empresas).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_categoria_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_categoria_check CHECK (
        categoria IS NULL OR categoria IN (
          'Alimentos y bebidas',
          'Comercio y ventas',
          'Servicios profesionales',
          'Manufactura',
          'Construcción',
          'Salud',
          'Tecnología',
          'Turismo y hotelería',
          'Educación',
          'Otra'
        )
      );
  END IF;

  -- tamano: rangos de numero de empleados (permite NULL). El frontend deriva
  -- micro/pequeña/mediana de aqui.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_tamano_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_tamano_check CHECK (
        tamano IS NULL OR tamano IN ('1-10','11-50','51-200','201-500','500+')
      );
  END IF;

  -- radio_km: 1..25 km (permite NULL). FUTURE-PROOF + display: se guarda y es
  -- editable, pero en ESTA iteracion NO se conecta a ningun query de matching/
  -- cercania. Si en el futuro se usa para filtrar vacantes por radio de la
  -- empresa, se cablea aqui sin migrar datos.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_radio_km_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_radio_km_check CHECK (
        radio_km IS NULL OR radio_km BETWEEN 1 AND 25
      );
  END IF;

  -- Longitudes razonables de textos largos para evitar payloads abusivos,
  -- alineado con char_length() usado en messages/profiles. NULL permitido.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_historia_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_historia_check CHECK (
        historia IS NULL OR char_length(historia) BETWEEN 1 AND 2000
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_mision_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_mision_check CHECK (
        mision IS NULL OR char_length(mision) BETWEEN 1 AND 2000
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_vision_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_vision_check CHECK (
        vision IS NULL OR char_length(vision) BETWEEN 1 AND 2000
      );
  END IF;

  -- Campos de contacto / legales: longitudes acotadas.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_razon_social_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_razon_social_check CHECK (
        razon_social IS NULL OR char_length(razon_social) BETWEEN 1 AND 200
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_correo_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_correo_check CHECK (
        correo IS NULL OR char_length(correo) BETWEEN 3 AND 254
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_telefono_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_telefono_check CHECK (
        telefono IS NULL OR char_length(telefono) BETWEEN 7 AND 25
      );
  END IF;

  -- Redes sociales: handle o URL, acotado.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_instagram_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_instagram_check CHECK (instagram IS NULL OR char_length(instagram) BETWEEN 1 AND 300);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_facebook_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_facebook_check CHECK (facebook IS NULL OR char_length(facebook) BETWEEN 1 AND 300);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_linkedin_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_linkedin_check CHECK (linkedin IS NULL OR char_length(linkedin) BETWEEN 1 AND 300);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_x_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_x_check CHECK (x IS NULL OR char_length(x) BETWEEN 1 AND 300);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_tiktok_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_tiktok_check CHECK (tiktok IS NULL OR char_length(tiktok) BETWEEN 1 AND 300);
  END IF;

  -- valores / beneficios: limitar cardinalidad del array y el TAMAÑO TOTAL del
  -- payload. NOTA: un CHECK constraint NO admite subqueries (SQLSTATE 0A000), por
  -- lo que NO se valida la longitud por-elemento aquí (eso requeriría unnest()).
  -- Acotamos cardinalidad (≤12) + longitud total del array concatenado, que es
  -- una expresión escalar permitida. El límite por-elemento (≤60 / ≤80) se aplica
  -- en el cliente vía Zod; este CHECK es la red de seguridad server-side contra
  -- payloads abusivos (cardinalidad + bytes totales).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_valores_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_valores_check CHECK (
        cardinality(valores) <= 12
        AND char_length(array_to_string(valores, '')) <= 720  -- 12 * 60
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_beneficios_check') THEN
    ALTER TABLE public.companies
      ADD CONSTRAINT companies_beneficios_check CHECK (
        cardinality(beneficios) <= 12
        AND char_length(array_to_string(beneficios, '')) <= 960  -- 12 * 80
      );
  END IF;
END $$;

-- ============================================================
-- COMMENTs
-- ============================================================
COMMENT ON COLUMN public.companies.razon_social IS 'Razón social / nombre legal de la empresa. Dato del negocio, público.';
COMMENT ON COLUMN public.companies.correo       IS 'Correo empresarial de contacto. Dato del NEGOCIO (no PII de persona), público en el perfil.';
COMMENT ON COLUMN public.companies.telefono     IS 'Teléfono de contacto de la empresa. Dato del negocio, público.';
COMMENT ON COLUMN public.companies.categoria    IS 'Giro/industria de la empresa (lista cerrada). Distinto de jobs.categoria (taxonomía de vacantes).';
COMMENT ON COLUMN public.companies.tamano       IS 'Rango de número de empleados (1-10/11-50/51-200/201-500/500+). El frontend deriva micro/pequeña/mediana.';
COMMENT ON COLUMN public.companies.historia     IS 'Historia de la empresa (texto largo, máx 2000).';
COMMENT ON COLUMN public.companies.mision       IS 'Misión de la empresa (máx 2000).';
COMMENT ON COLUMN public.companies.vision       IS 'Visión de la empresa (máx 2000).';
COMMENT ON COLUMN public.companies.valores      IS 'Lista de valores (máx 12 elementos; total ≤720 chars; ≤60 c/u validado en cliente).';
COMMENT ON COLUMN public.companies.beneficios   IS 'Lista de beneficios (máx 12 elementos; total ≤960 chars; ≤80 c/u validado en cliente).';
COMMENT ON COLUMN public.companies.radio_km     IS 'Radio de cobertura en km (1..25). DISPLAY + FUTURE-PROOF: NO se usa en ningún query de matching/cercanía en esta iteración.';
COMMENT ON COLUMN public.companies.horarios     IS 'Horarios de atención (jsonb libre: { lun_vie, abre_sab, sab, abre_dom, dom }).';
COMMENT ON COLUMN public.companies.instagram    IS 'Instagram (handle o URL).';
COMMENT ON COLUMN public.companies.facebook     IS 'Facebook (handle o URL).';
COMMENT ON COLUMN public.companies.linkedin     IS 'LinkedIn (handle o URL).';
COMMENT ON COLUMN public.companies.x            IS 'X / Twitter (handle o URL).';
COMMENT ON COLUMN public.companies.tiktok       IS 'TikTok (handle o URL).';

-- ============================================================
-- FUTURO (NO en esta iteración) — verificación por documentos
-- ============================================================
-- Hoy la verificación tiene SOLO 2 estados reales: no verificada / verificada,
-- representados por companies.is_verified (bool) + verified_at, gobernados por
-- verify_company() (admin) y trg_prevent_verification_tampering. NO hay flujo
-- de solicitud ni subida de documentos.
--
-- Cuando se implemente el flujo de "solicitar verificación subiendo documentos"
-- (v3), se agregaría aprox:
--   -- ALTER TABLE public.companies
--   --   ADD COLUMN verification_status text NOT NULL DEFAULT 'none'
--   --     CHECK (verification_status IN ('none','pending','verified'));
--   -- CREATE TABLE public.verification_requests (
--   --   id uuid pk, company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
--   --   status text CHECK (status IN ('pending','approved','rejected')),
--   --   submitted_by uuid REFERENCES profiles(id),
--   --   reviewed_by uuid REFERENCES profiles(id) NULL,
--   --   created_at timestamptz, reviewed_at timestamptz NULL, notes text NULL
--   -- );  -- + RLS: owner inserta/lee las suyas; admins leen/actualizan todas.
--   -- Storage: bucket privado 'verification-docs' con RLS por company owner +
--   --   acceso admin, para CSF/acta constitutiva/comprobante de domicilio.
-- NADA de lo anterior se crea ahora (YAGNI para el MVP/V2 actual).
