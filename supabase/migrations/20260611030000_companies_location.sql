-- Ubicación de la empresa: lat/lng nullable (las empresas existentes no la
-- tienen aún; el form la captura). Se usa como default del mapa al publicar
-- una vacante, ahorrando colocar el pin cada vez. Sin columna PostGIS:
-- companies no participa en queries geográficas en el MVP — si algún día se
-- necesita, se agrega location + trigger de sync como en jobs.

alter table public.companies
  add column if not exists lat double precision,
  add column if not exists lng double precision;

alter table public.companies
  add constraint companies_lat_check check (lat is null or (lat between -90 and 90)),
  add constraint companies_lng_check check (lng is null or (lng between -180 and 180));
