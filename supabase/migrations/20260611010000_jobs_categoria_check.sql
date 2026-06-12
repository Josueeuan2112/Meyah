-- Integridad de jobs.categoria: hoy es texto libre validado solo por Zod en el
-- cliente. Este CHECK cierra la integridad del lado servidor con las 11
-- categorías reales (fuente de verdad: JOB_CATEGORIES en
-- src/features/jobs/schemas/categories.ts — mantener ambos en sinc).
-- CHECK en vez de enum: agregar/quitar categorías es un ALTER de constraint,
-- no una migración de tipo (menos disruptivo). jornada no necesita esto:
-- ya es enum job_schedule desde 20260610030000.

alter table public.jobs
  add constraint jobs_categoria_check check (
    categoria in (
      'ventas',
      'atencion_cliente',
      'retail',
      'restaurantes',
      'administracion',
      'gerencia',
      'operativo',
      'servicios',
      'transporte',
      'salud_belleza',
      'otro'
    )
  );
