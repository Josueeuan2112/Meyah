-- Corrección: la auditoría de integridad agregó jobs_salario_check sin notar
-- que el init schema YA cubría ambas reglas con jobs_check
-- (salario_max >= salario_min) y jobs_salario_min_check (salario_min >= 0).
-- Se retira el duplicado para no validar dos veces lo mismo ni ensuciar el
-- esquema. La defensa server-side de salarios queda en los constraints
-- originales (verificada: insert con max<min es rechazado por jobs_check).

alter table public.jobs drop constraint if exists jobs_salario_check;
