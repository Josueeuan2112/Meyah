-- ============================================================
-- MEYAH — Migración inicial del esquema
-- Marketplace de empleos formales por cercanía en Mérida, Yucatán
-- ============================================================
-- NOTA: PostGIS debe estar habilitado en el proyecto Supabase.
-- Si no lo está: CREATE EXTENSION IF NOT EXISTS postgis;
-- ============================================================

-- ============================================================
-- 1. TIPOS PERSONALIZADOS (ENUMS)
-- ============================================================

CREATE TYPE user_type AS ENUM ('empleador', 'candidato');
CREATE TYPE job_status AS ENUM ('abierta', 'cerrada');
CREATE TYPE application_status AS ENUM ('pendiente', 'vista', 'rechazada', 'aceptada');

-- ============================================================
-- 2. FUNCIÓN COMPARTIDA: actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. TABLA: profiles (perfil público de cada usuario)
-- El id apunta a auth.users.id de Supabase Auth
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo user_type NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  lat_referencia DOUBLE PRECISION,
  lng_referencia DOUBLE PRECISION,
  is_searchable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_tipo ON public.profiles(tipo) WHERE deleted_at IS NULL;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.profiles IS 'Perfil público de cada usuario. El id apunta a auth.users.id de Supabase Auth.';
COMMENT ON COLUMN public.profiles.tipo IS 'empleador o candidato. Define el rol del usuario en la plataforma.';
COMMENT ON COLUMN public.profiles.lat_referencia IS 'Latitud de referencia del candidato (su zona base) para búsquedas geográficas.';
COMMENT ON COLUMN public.profiles.lng_referencia IS 'Longitud de referencia del candidato (su zona base) para búsquedas geográficas.';
COMMENT ON COLUMN public.profiles.is_searchable IS 'Si TRUE, el candidato acepta ser encontrado por empleadores en búsqueda activa (sourcing). Feature de v3. Default FALSE = privacidad máxima.';

/* Las políticas RLS de profiles se crean al final de la migración porque las otras tablas 
(companies, jobs, applications) hacen JOIN con profiles para validar el tipo de usuario y su ID en sus propias políticas. 
Si se crean antes de la tabla de profiles, dan error por referencia a una tabla o columna inexistente. */

-- ============================================================
-- 4. TABLA: companies (empresas de empleadores)
-- ============================================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  direccion TEXT NOT NULL,
  sitio_web TEXT,
  logo_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_companies_owner_id ON public.companies(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_verified ON public.companies(is_verified) WHERE is_verified = TRUE AND deleted_at IS NULL;

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.companies IS 'Empresas registradas por usuarios empleadores. Cada empresa pertenece a un owner (perfil de tipo empleador).';
COMMENT ON COLUMN public.companies.owner_id IS 'ID del usuario empleador dueño de esta empresa.';
COMMENT ON COLUMN public.companies.is_verified IS 'Badge de verificación. Activación manual por admin en futuras versiones (v3).';

-- Políticas RLS de companies
CREATE POLICY "companies_select_public"
  ON public.companies FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "companies_insert_own"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tipo = 'empleador'
    )
  );

CREATE POLICY "companies_update_own"
  ON public.companies FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- 5. TABLA: jobs (vacantes con geolocalización PostGIS)
-- ============================================================

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  salario_min INTEGER NOT NULL CHECK (salario_min >= 0),
  salario_max INTEGER NOT NULL CHECK (salario_max >= salario_min),
  categoria TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  estado job_status NOT NULL DEFAULT 'abierta',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  applications_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Trigger: sincronizar location desde lat/lng automáticamente
CREATE OR REPLACE FUNCTION sync_job_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_jobs_location
  BEFORE INSERT OR UPDATE OF lat, lng ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION sync_job_location();

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_jobs_company_id ON public.jobs(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_estado ON public.jobs(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_slug ON public.jobs(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_location_gist ON public.jobs USING GIST(location) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_featured ON public.jobs(is_featured, featured_until)
  WHERE is_featured = TRUE AND deleted_at IS NULL;

COMMENT ON TABLE public.jobs IS 'Vacantes de empleo publicadas por empresas. Cada vacante tiene una ubicación geográfica para búsqueda por cercanía.';
COMMENT ON COLUMN public.jobs.location IS 'Punto geográfico (lng, lat) en formato WGS84. Sincronizado automáticamente desde lat/lng por trigger. Usado por PostGIS para queries de cercanía.';
COMMENT ON COLUMN public.jobs.slug IS 'URL amigable única, ej: gerente-ventas-altabrisa-abc123.';
COMMENT ON COLUMN public.jobs.expires_at IS 'Fecha de caducidad. Por defecto 30 días desde creación. Vacantes expiradas se filtran automáticamente.';

-- Políticas RLS de jobs
CREATE POLICY "jobs_select_public_open"
  ON public.jobs FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND estado = 'abierta'
    AND expires_at > NOW()
  );

CREATE POLICY "jobs_select_owner"
  ON public.jobs FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = jobs.company_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "jobs_insert_owner"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = jobs.company_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "jobs_update_owner"
  ON public.jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = jobs.company_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = jobs.company_id
        AND c.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 6. TABLA: applications (postulaciones, puente candidato↔vacante)
-- ============================================================

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  mensaje TEXT,
  estado application_status NOT NULL DEFAULT 'pendiente',
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_application_per_candidate_job UNIQUE (candidato_id, job_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_applications_candidato ON public.applications(candidato_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_job ON public.applications(job_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_estado ON public.applications(estado) WHERE deleted_at IS NULL;

CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.applications IS 'Postulaciones de candidatos a vacantes. Tabla puente entre profiles y jobs.';
COMMENT ON COLUMN public.applications.estado IS 'Ciclo de vida: pendiente → vista → (aceptada o rechazada).';
COMMENT ON COLUMN public.applications.viewed_at IS 'Fecha en que el empleador vio la postulación por primera vez.';
COMMENT ON COLUMN public.applications.responded_at IS 'Fecha en que el empleador respondió (aceptó o rechazó).';

-- Políticas RLS de applications
CREATE POLICY "applications_select_involved"
  ON public.applications FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() = candidato_id
      OR EXISTS (
        SELECT 1 FROM public.jobs j
        JOIN public.companies c ON c.id = j.company_id
        WHERE j.id = applications.job_id
          AND c.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "applications_insert_own"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = candidato_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tipo = 'candidato'
    )
  );

CREATE POLICY "applications_update_candidate"
  ON public.applications FOR UPDATE TO authenticated
  USING (auth.uid() = candidato_id)
  WITH CHECK (auth.uid() = candidato_id);

CREATE POLICY "applications_update_employer"
  ON public.applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id
        AND c.owner_id = auth.uid()
    )
  );

/*
IMPORTANTE: MOVI LAS POLITICAS AL DE PROFILE AL FINAL PORQUE SI NO SE CREAN EN ORDEN, 
NO SE PUEDEN REFERENCIAR EN LAS POLITICAS DE LAS OTRAS TABLAS (COMPANIES, JOBS, APPLICATIONS) QUE HACEN JOIN CON PROFILES PARA VALIDAR EL TIPO DE USUARIO Y SU ID. 
SI SE CREAN ANTES DE LA TABLA DE PROFILES, DAN ERROR PORQUE NO EXISTE LA TABLA NI SUS COLUMNAS AUN.
*/
  -- Políticas RLS de profiles 
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "profiles_select_applicants"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE a.candidato_id = profiles.id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
-- ============================================================
-- FIN DE LA MIGRACIÓN INICIAL
-- ============================================================