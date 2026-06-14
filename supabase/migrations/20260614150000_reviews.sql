-- ============================================================
-- Feature 2.7: Ratings/Reviews System
-- Candidates rate employer process experience after completed
-- interactions (application estado = 'aceptada' or 'rechazada').
-- ============================================================

-- 1. TABLA: reviews
-- ============================================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (comment IS NULL OR char_length(comment) BETWEEN 1 AND 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_review_per_application UNIQUE (application_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reviews_company_id ON public.reviews(company_id);

COMMENT ON TABLE public.reviews IS 'Reseñas de candidatos sobre el proceso de una empresa. Una por aplicación completada (aceptada/rechazada).';
COMMENT ON COLUMN public.reviews.application_id IS 'Postulación que otorga el derecho a reseñar. UNIQUE = máximo una reseña por postulación.';
COMMENT ON COLUMN public.reviews.author_id IS 'Candidato que escribe la reseña (dueño de la postulación).';
COMMENT ON COLUMN public.reviews.company_id IS 'Empresa reseñada (desnormalizado desde jobs para queries de agregación rápidas).';
COMMENT ON COLUMN public.reviews.rating IS 'Calificación de 1 a 5 estrellas.';
COMMENT ON COLUMN public.reviews.comment IS 'Comentario opcional, máximo 300 caracteres.';

-- Políticas RLS de reviews

-- SELECT: cualquier usuario autenticado puede leer (los datos se muestran como agregados)
CREATE POLICY "reviews_select_authenticated"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

-- INSERT: solo el candidato dueño de la postulación, y solo si la postulación está aceptada o rechazada
CREATE POLICY "reviews_insert_own_completed"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = application_id
        AND a.candidato_id = auth.uid()
        AND a.estado IN ('aceptada', 'rechazada')
        AND a.deleted_at IS NULL
        AND j.company_id = reviews.company_id
    )
  );

-- No UPDATE ni DELETE: las reseñas son inmutables una vez publicadas.

-- ============================================================
-- 2. RPC: company_rating
-- Devuelve promedio y conteo de reseñas para una empresa.
-- ============================================================

CREATE OR REPLACE FUNCTION public.company_rating(p_company_id uuid)
RETURNS TABLE (average_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    round(avg(r.rating)::numeric, 1) AS average_rating,
    count(*)                          AS review_count
  FROM public.reviews r
  WHERE r.company_id = p_company_id;
$$;

COMMENT ON FUNCTION public.company_rating(uuid) IS 'Devuelve el rating promedio (1 decimal) y cantidad de reseñas de una empresa.';

-- ============================================================
-- 3. TABLA: review_reports (reportes de abuso)
-- ============================================================

CREATE TABLE public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_report_per_user_per_review UNIQUE (review_id, reporter_id)
);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.review_reports IS 'Reportes de abuso sobre reseñas. Un reporte por usuario por reseña.';
COMMENT ON COLUMN public.review_reports.reason IS 'Motivo del reporte, máximo 500 caracteres.';

-- Políticas RLS de review_reports

-- INSERT: solo el empleador (dueño de la empresa reseñada) puede reportar
CREATE POLICY "review_reports_insert_employer"
  ON public.review_reports FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id
    AND EXISTS (
      SELECT 1 FROM public.reviews rv
      JOIN public.companies c ON c.id = rv.company_id
      WHERE rv.id = review_id
        AND c.owner_id = auth.uid()
    )
  );
