-- Integridad server-side de salarios: Zod ya valida en cliente (min>=0,
-- max>=min), pero un cliente manipulado con la anon key podía insertar
-- sueldos negativos o invertidos. El cliente valida UX; la BD valida verdad.
-- Espejo de las reglas de jobSchema.ts — mantener en sinc.

alter table public.jobs
  add constraint jobs_salario_check check (
    salario_min >= 0 and salario_max >= salario_min
  );
