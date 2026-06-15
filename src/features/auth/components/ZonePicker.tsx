import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet'
import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { meyahPin } from '@/shared/lib/mapPin'

// Mapa del paso "Tu zona" del registro: pin arrastrable (también responde a
// clics) + círculo con el radio de búsqueda. Cuando lat/lng cambian desde
// afuera (búsqueda de dirección geocodificada), el mapa vuela suave al punto.
// Con `locked` el mapa es solo lectura (pasos donde la zona ya quedó fija).

const PIN = meyahPin(42)

// Trazo/relleno del círculo: hex literales de los tokens jade porque Leaflet
// pinta SVG por atributo y ahí var() de CSS no resuelve.
const CIRCLE_STYLE = { color: '#1B998B', weight: 2, fillColor: '#1B998B', fillOpacity: 0.1 }

interface ZonePickerProps {
  lat: number
  lng: number
  radiusKm: number
  onChange: (lat: number, lng: number) => void
  /** Solo lectura: sin drag ni clics (pasos del registro posteriores a "Tu zona") */
  locked?: boolean
  /** Apagar el círculo de radio (empleadores: su ubicación vive en la empresa) */
  showRadius?: boolean
  /** Cambia cuando el contenedor pudo pasar de display:none a visible (móvil) */
  resizeKey?: string | number
}

function FlyToPoint({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const firstRender = useRef(true)
  useEffect(() => {
    // En el mount no hay nada que volar: MapContainer ya centró en lat/lng.
    // Además, si el contenedor está oculto (display:none en móvil) el mapa
    // mide 0×0 y la interpolación de flyTo proyecta NaN y truena Leaflet.
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const zoom = Math.max(map.getZoom(), 13)
    const size = map.getSize()
    if (size.x === 0 || size.y === 0) {
      map.setView([lat, lng], zoom)
    } else {
      map.flyTo([lat, lng], zoom, { duration: 0.7 })
    }
  }, [lat, lng, map])
  return null
}

// A nivel de módulo (no dentro del componente): definir componentes durante el
// render rompe la identidad entre renders y lo marca react-hooks como error.
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Leaflet calcula su tamaño al montar; si el contenedor estaba oculto
// (display:none en móvil según el paso) queda en 0×0 y los tiles salen grises.
// Recalcular cuando resizeKey cambia cubre el caso de volverse visible.
function InvalidateOnShow({ resizeKey }: { resizeKey?: string | number }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60)
    return () => clearTimeout(t)
  }, [resizeKey, map])
  return null
}

export default function ZonePicker({
  lat,
  lng,
  radiusKm,
  onChange,
  locked = false,
  showRadius = true,
  resizeKey,
}: ZonePickerProps) {
  const markerRef = useRef<L.Marker>(null)

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker) {
          const { lat: newLat, lng: newLng } = marker.getLatLng()
          onChange(newLat, newLng)
        }
      },
    }),
    [onChange]
  )

  return (
    <MapContainer center={[lat, lng]} zoom={13} zoomControl={false} className="h-full w-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      {!locked && <ClickHandler onPick={onChange} />}
      {showRadius && <Circle center={[lat, lng]} radius={radiusKm * 1000} pathOptions={CIRCLE_STYLE} />}
      {/* key: Leaflet solo lee draggable al crear el marker; remontarlo al cambiar locked */}
      <Marker
        key={locked ? 'locked' : 'free'}
        position={[lat, lng]}
        icon={PIN}
        draggable={!locked}
        ref={markerRef}
        eventHandlers={eventHandlers}
      />
      <FlyToPoint lat={lat} lng={lng} />
      <InvalidateOnShow resizeKey={resizeKey} />
    </MapContainer>
  )
}
