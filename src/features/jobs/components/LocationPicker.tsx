import { useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url'
import iconUrl from 'leaflet/dist/images/marker-icon.png?url'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url'

// Leaflet usa _getIconUrl internamente y puede ignorar las opciones de ícono.
// Borrarlo fuerza a Leaflet a respetar las URLs que pasamos abajo.
// `as unknown as { _getIconUrl?: unknown }` evita `any` (propiedad interna no tipada).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

interface LocationPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const markerRef = useRef<L.Marker>(null)

  // Subcomponente que captura clics en el mapa
  function ClickHandler() {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat, e.latlng.lng)
      },
    })
    return null
  }

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
      style={{ height: '300px', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <ClickHandler />
      <Marker
        position={[lat, lng]}
        draggable
        ref={markerRef}
        eventHandlers={eventHandlers}
      />
    </MapContainer>
  )
}
