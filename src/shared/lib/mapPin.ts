import L from 'leaflet'

// Pin de ubicación de Meyah: gota jade con borde blanco, punto interior y
// brillo glossy. Reemplaza el marker azul default de Leaflet en los pickers
// (ZonePicker, LocationPicker). Es un L.divIcon con SVG inline; el gradiente
// usa los hex de los tokens (#1B998B jade-500 → #147068 jade-700) porque los
// atributos SVG no resuelven var() de CSS.

export function meyahPin(size = 40): L.DivIcon {
  const h = Math.round(size * 1.28)
  const svg = `
<svg width="${size}" height="${h}" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="meyahPinGrad" x1="6" y1="2" x2="30" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1B998B"/>
      <stop offset="1" stop-color="#147068"/>
    </linearGradient>
  </defs>
  <path d="M18 1.5 C9.1 1.5 2 8.6 2 17.5 C2 29.5 18 44.5 18 44.5 C18 44.5 34 29.5 34 17.5 C34 8.6 26.9 1.5 18 1.5 Z"
        fill="url(#meyahPinGrad)" stroke="#fff" stroke-width="2.5"/>
  <circle cx="18" cy="17" r="6" fill="#fff"/>
  <circle cx="18" cy="17" r="2.6" fill="#1B998B"/>
  <ellipse cx="12.5" cy="9" rx="5.5" ry="3" transform="rotate(-28 12.5 9)" fill="#fff" opacity="0.32"/>
</svg>`
  return L.divIcon({
    className: '',
    iconSize: [size, h],
    iconAnchor: [size / 2, h - 2], // la punta de la gota marca el punto exacto
    html: `<div style="filter:drop-shadow(0 6px 10px rgba(0,0,0,.3));">${svg}</div>`,
  })
}
