do $$ begin
  if not exists (select 1 from pg_type where typname = 'job_schedule') then
    create type job_schedule as enum ('tiempo_completo','medio_tiempo','turnos','comision');
  end if;
end $$;

alter table public.jobs add column if not exists jornada job_schedule not null default 'tiempo_completo';
