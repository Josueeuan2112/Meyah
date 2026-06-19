import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { meyahPin } from '@/shared/lib/mapPin'

// Pin de marca (gota jade glossy) en lugar del marker azul default de Leaflet.
// Tiles de CARTO light: mismos del FeedMap/ZonePicker, para que todos los
// mapas de la app se vean de la misma familia.

const PIN = meyahPin(42)

interface LocationPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
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

// react-leaflet solo lee `center` en el primer render. Cuando lat/lng cambian
// desde fuera (buscador de dirección), el viewport no hace pan y el pin queda
// fuera de pantalla. Este hijo escucha cambios de props y reposiciona la vista.
// Compara contra el centro actual con tolerancia para no recentrar (ni crear
// loops) cuando el cambio viene del propio arrastre del usuario.
function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    const current = map.getCenter()
    const moved = Math.abs(current.lat - lat) > 1e-5 || Math.abs(current.lng - lng) > 1e-5
    if (moved) map.setView([lat, lng], map.getZoom())
  }, [map, lat, lng])
  return null
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const markerRef = useRef<L.Marker>(null)

  // Memoizar los eventHandlers para no recrearlos en cada render
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
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      <ClickHandler onPick={onChange} />
      <RecenterOnChange lat={lat} lng={lng} />
      <Marker
        position={[lat, lng]}
        icon={PIN}
        draggable
        ref={markerRef}
        eventHandlers={eventHandlers}
      />
    </MapContainer>
  )
}
