import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { renderToStaticMarkup } from 'react-dom/server'

import { ICON_BY_CATEGORY } from '@/features/jobs/schemas/categories'
import type { JobCategoryValue } from '@/features/jobs/schemas/categories'
import type { NearbyJob } from '@/features/jobs/hooks/useNearbyJobs'

// El CSS de Leaflet se importa aquí (no global): solo baja con el chunk del mapa.
// Vite lo deduplica si otro componente de mapa también lo importa.

const MERIDA_CENTER: [number, number] = [20.9674, -89.5926]

function categoryPin(categoria: string, active = false) {
  const Icon = ICON_BY_CATEGORY[categoria as JobCategoryValue] ?? ICON_BY_CATEGORY.otro
  const size = active ? 44 : 36
  const svg = renderToStaticMarkup(<Icon size={active ? 19 : 16} />)
  const bg = active ? 'var(--color-meyah-jade-700)' : 'var(--color-meyah-crema-100)'
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:${active ? 3 : 2.5}px solid var(--color-meyah-jade-500);box-shadow:0 ${active ? 8 : 4}px ${active ? 18 : 12}px -3px rgba(0,0,0,${active ? 0.38 : 0.28}),inset 0 2px 3px rgba(255,255,255,${active ? 0.25 : 0.85}),inset 0 -2px 4px rgba(0,0,0,0.07);display:grid;place-items:center;color:${active ? '#fff' : 'var(--color-meyah-jade-500)'};">${svg}</div>`,
  })
}

const userPin = L.divIcon({
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: `<div style="position:relative;width:16px;height:16px;"><div style="width:16px;height:16px;border-radius:50%;background:var(--color-meyah-terracota-500);border:3px solid #fff;box-shadow:0 2px 8px -2px rgba(0,0,0,.35);"></div><div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid var(--color-meyah-border-soft);border-radius:99px;padding:1px 7px;font:600 11px/1.2 sans-serif;color:var(--color-meyah-tinta-900);white-space:nowrap;">Tú</div></div>`,
})

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  // Firma por VALOR de los puntos: `points` es un array nuevo en cada render
  // (cada hover re-renderiza el feed), y con la referencia como dependencia
  // el efecto corría siempre — el mapa se re-encuadraba y cancelaba el
  // pan/zoom del usuario al pasar el mouse por las tarjetas.
  const signature = points.map(p => `${p[0]},${p[1]}`).join(';')
  useEffect(() => {
    if (points.length === 0) return
    map.fitBounds(L.latLngBounds(points), { padding: [56, 56], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- points representado por signature
  }, [signature, map])
  return null
}

interface FeedMapProps {
  jobs: NearbyJob[]
  userLat: number | null
  userLng: number | null
  onSelect: (job: NearbyJob) => void
  hoveredJobId: string | null
  onHover: (id: string | null) => void
}

export default function FeedMap({ jobs, userLat, userLng, onSelect, hoveredJobId, onHover }: FeedMapProps) {
  const located = jobs.filter(j => j.lat != null && j.lng != null)
  const hasUser = userLat != null && userLng != null
  const center: [number, number] = hasUser ? [userLat, userLng] : MERIDA_CENTER
  const points: [number, number][] = [
    ...located.map(j => [j.lat, j.lng] as [number, number]),
    ...(hasUser ? [[userLat, userLng] as [number, number]] : []),
  ]

  return (
    <MapContainer center={center} zoom={13} zoomControl={false} className="h-full w-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      {hasUser && <Marker position={[userLat, userLng]} icon={userPin} />}
      {located.map(j => (
        <Marker
          key={j.id}
          position={[j.lat, j.lng]}
          icon={categoryPin(j.categoria, j.id === hoveredJobId)}
          zIndexOffset={j.id === hoveredJobId ? 1000 : 0}
          eventHandlers={{
            click: () => onSelect(j),
            mouseover: () => onHover(j.id),
            mouseout: () => onHover(null),
          }}
        />
      ))}
      <FitBounds points={points} />
    </MapContainer>
  )
}
