-- Extiende handle_new_user para guardar phone y ubicación de referencia
-- (candidatos) que llegan en raw_user_meta_data desde el registro.
-- nombre/tipo conservan su comportamiento previo (con COALESCE de defaults).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, nombre, tipo, phone, lat_referencia, lng_referencia)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    coalesce((new.raw_user_meta_data->>'tipo')::user_type, 'candidato'),
    new.raw_user_meta_data->>'phone',
    (new.raw_user_meta_data->>'lat_referencia')::double precision,
    (new.raw_user_meta_data->>'lng_referencia')::double precision
  );
  return new;
end;
$function$;
