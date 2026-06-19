-- 20260615062000_company_saves.sql
-- V2 — Guardar empresa en favoritos. 100% PRIVADO: solo el propio candidato
-- lee/inserta/borra sus filas. Sin conteo público, sin RPC, sin exposición a
-- terceros (ni siquiera al owner de la empresa).
--
-- gen:types CAMBIA (nueva tabla company_saves).

-- ============================================================
-- 1. TABLA: company_saves
-- ============================================================
CREATE TABLE public.company_saves (
  company_id   uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidato_id uuid        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_company_saves PRIMARY KEY (company_id, candidato_id)
);

-- Listado eficiente de "mis empresas guardadas".
CREATE INDEX idx_company_saves_candidato ON public.company_saves(candidato_id);

ALTER TABLE public.company_saves ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.company_saves IS 'Favoritos privados candidato→empresa. Solo el propio candidato puede leer/insertar/borrar. Sin exposición pública ni agregada.';

-- ============================================================
-- 2. RLS — privado total (solo el dueño de la fila)
-- ============================================================
CREATE POLICY "company_saves_select_own"
  ON public.company_saves FOR SELECT TO authenticated
  USING (auth.uid() = candidato_id);

CREATE POLICY "company_saves_insert_own"
  ON public.company_saves FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = candidato_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tipo = 'candidato'
    )
    AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_id
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "company_saves_delete_own"
  ON public.company_saves FOR DELETE TO authenticated
  USING (auth.uid() = candidato_id);

-- (Sin UPDATE: fila inmutable; quitar de favoritos = DELETE.)
-- (Sin RPC de conteo: a diferencia de company_follows, los favoritos NO tienen
--  métrica pública. Privacidad máxima.)
