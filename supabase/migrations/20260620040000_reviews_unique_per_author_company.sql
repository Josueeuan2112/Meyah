-- 20260620040000_reviews_unique_per_author_company.sql
-- M3 (MEDIO): una resena por empresa por autor.
--
-- Estado original (verificado con pg_get_constraintdef):
--   unique_review_per_application  UNIQUE (application_id)
-- Eso permite que un mismo autor con N postulaciones aceptadas/rechazadas en la
-- misma empresa deje N resenas (una por application) -> inflar/spam de rating.
--
-- Cambio: la unicidad pasa a (author_id, company_id). Verificado que no hay
-- datos en violacion (0 grupos duplicados por author_id+company_id).
--
-- Se CONSERVA la columna application_id: sigue siendo la evidencia del derecho a
-- resenar (la policy reviews_insert_own_completed la usa para validar que el
-- autor fue candidato aceptado/rechazado). Esa policy NO referencia el nombre
-- del constraint, asi que el cambio no la afecta.

alter table public.reviews
  drop constraint unique_review_per_application;

alter table public.reviews
  add constraint unique_review_per_author_company
  unique (author_id, company_id);
