-- Preferencias de candidato para el registro de 3 pasos:
--   radio_busqueda_km  → radio de búsqueda elegido en "Tu zona" (1–20 km)
--   categorias_interes → "¿qué tipo de empleo buscas?" (subset de las 11 categorías)
--   disponibilidad     → reusa el enum job_schedule (matchable contra jobs.jornada)
-- Todas nullable: empleadores y cuentas pre-existentes no las llenan.
-- El CHECK de categorias_interes refleja jobs_categoria_check — mantener en sinc
-- con JOB_CATEGORIES (src/features/jobs/schemas/categories.ts).

alter table public.profiles
  add column if not exists radio_busqueda_km smallint,
  add column if not exists categorias_interes text[],
  add column if not exists disponibilidad job_schedule;

alter table public.profiles
  add constraint profiles_radio_busqueda_km_check
    check (radio_busqueda_km is null or radio_busqueda_km between 1 and 20);

alter table public.profiles
  add constraint profiles_categorias_interes_check
    check (
      categorias_interes is null
      or categorias_interes <@ array[
        'ventas','atencion_cliente','retail','restaurantes','administracion',
        'gerencia','operativo','servicios','transporte','salud_belleza','otro'
      ]::text[]
    );

-- handle_new_user: misma definición previa + las tres preferencias nuevas
-- leídas de raw_user_meta_data (el front las manda en options.data del signUp).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, nombre, tipo, phone, lat_referencia, lng_referencia,
    radio_busqueda_km, categorias_interes, disponibilidad
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    coalesce((new.raw_user_meta_data->>'tipo')::user_type, 'candidato'),
    new.raw_user_meta_data->>'phone',
    (new.raw_user_meta_data->>'lat_referencia')::double precision,
    (new.raw_user_meta_data->>'lng_referencia')::double precision,
    (new.raw_user_meta_data->>'radio_busqueda_km')::smallint,
    case
      when new.raw_user_meta_data ? 'categorias_interes'
        and jsonb_typeof(new.raw_user_meta_data->'categorias_interes') = 'array'
      then array(select jsonb_array_elements_text(new.raw_user_meta_data->'categorias_interes'))
      else null
    end,
    (new.raw_user_meta_data->>'disponibilidad')::job_schedule
  );
  return new;
end;
$$;
