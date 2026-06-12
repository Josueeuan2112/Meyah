// Geocoding directo (dirección → coordenadas) con Nominatim de OpenStreetMap:
// gratis y sin API key, alineado con el stack de mapas (Leaflet + OSM).
// Acotado al área metropolitana de Mérida vía viewbox + bounded=1.
// Política de uso de Nominatim: máx 1 req/seg — por eso solo se llama al
// confirmar la búsqueda (botón / Enter), nunca en cada tecla.

// left,top,right,bottom — caja que cubre Mérida y alrededores
const MERIDA_VIEWBOX = '-89.78,21.12,-89.42,20.80'

export interface GeocodeResult {
  lat: number
  lng: number
  label: string
}

interface NominatimItem {
  lat: string
  lon: string
  display_name: string
}

// Geocoding inverso (coordenadas → nombre de zona) para la tarjeta
// "Tu zona aproximada" del registro. zoom=14 devuelve nivel colonia/suburbio.
// Misma política de Nominatim: el caller debe llamarlo con debounce tras
// soltar el pin, nunca en cada movimiento.
export async function reverseGeocodeZone(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'jsonv2',
    zoom: '14',
    'accept-language': 'es',
  })

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`)
    if (!res.ok) return null

    const data = (await res.json()) as { address?: Record<string, string | undefined> }
    const a = data.address ?? {}
    return a.suburb ?? a.neighbourhood ?? a.quarter ?? a.residential ?? a.city_district ?? a.town ?? a.city ?? null
  } catch {
    // Sin red o petición bloqueada: el caller cae a un texto genérico
    return null
  }
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'mx',
    viewbox: MERIDA_VIEWBOX,
    bounded: '1',
    'accept-language': 'es',
  })

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)
  if (!res.ok) return null

  const data = (await res.json()) as NominatimItem[]
  const first = data[0]
  if (!first) return null

  return {
    lat: Number.parseFloat(first.lat),
    lng: Number.parseFloat(first.lon),
    label: first.display_name,
  }
}
