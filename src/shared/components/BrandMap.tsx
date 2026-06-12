import { Store, UtensilsCrossed, ShoppingCart, MapPin } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

// Mapa decorativo de marca: ilustración SVG estática (NO Leaflet — es ornamento,
// sin datos reales) con cuadrícula de calles, pines de categoría, el punto "Tú"
// y una ruta punteada entre ambos. Reusa el lenguaje visual de los pines del
// FeedMap. Se usa en el hero del landing y en los paneles oscuros de login/registro.

interface BrandMapProps {
  /** 'light' sobre fondos crema (hero), 'dark' sobre paneles jade-900 (auth) */
  variant?: 'light' | 'dark'
  /** Mini-tarjeta flotante de vacante de ejemplo (apagar si ya hay una tarjeta encima) */
  showCard?: boolean
  className?: string
}

export default function BrandMap({ variant = 'light', showCard = true, className }: BrandMapProps) {
  const dark = variant === 'dark'

  const street = dark ? 'rgba(255,255,255,0.10)' : '#FFFFFF'
  const avenue = dark ? 'rgba(255,255,255,0.16)' : '#FFFFFF'

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative h-full w-full overflow-hidden select-none',
        dark ? 'bg-white/6' : 'bg-meyah-crema-100',
        className,
      )}
    >
      {/* Calles: cuadrícula irregular + avenida diagonal + parque */}
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* Parque y manzanas de acento (solo en claro; en oscuro ensucian el panel) */}
        {!dark && (
          <>
            <rect x="252" y="36" width="92" height="64" rx="10" className="fill-meyah-jade-50" />
            <rect x="58" y="196" width="74" height="52" rx="8" className="fill-meyah-terracota-50" />
            <rect x="160" y="120" width="56" height="42" rx="8" fill="#fff" opacity="0.55" />
          </>
        )}

        {/* Cuadrícula de calles con curvas suaves */}
        <g fill="none" stroke={street} strokeWidth="7" strokeLinecap="round">
          <path d="M-10 64 C 110 58, 250 72, 410 62" />
          <path d="M-10 148 C 130 142, 270 156, 410 146" />
          <path d="M-10 232 C 120 226, 260 240, 410 230" />
          <path d="M84 -10 C 78 90, 92 200, 82 310" />
          <path d="M196 -10 C 190 100, 204 210, 194 310" />
          <path d="M310 -10 C 304 95, 318 205, 308 310" />
        </g>

        {/* Avenida diagonal más ancha */}
        <path d="M-20 292 C 120 220, 280 110, 420 28" fill="none" stroke={avenue} strokeWidth="12" strokeLinecap="round" />

        {/* Ruta punteada: de "Tú" al pin destacado */}
        <path
          d="M118 212 C 150 186, 196 140, 246 108"
          fill="none"
          className="stroke-meyah-terracota-500"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 9"
          opacity={dark ? 0.85 : 1}
        />
      </svg>

      {/* Pin destacado (conectado a la ruta y a la mini-tarjeta) */}
      <div className="absolute left-[58%] top-[30%] grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-meyah-jade-700 text-white shadow-lg">
        <UtensilsCrossed size={18} />
      </div>

      {/* Pines secundarios — mismo estilo suave del FeedMap */}
      <div className="absolute left-[24%] top-[22%] grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[2.5px] border-meyah-jade-500 bg-meyah-crema-100 text-meyah-jade-500 shadow-md">
        <Store size={15} />
      </div>
      <div className="absolute left-[80%] top-[62%] grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[2.5px] border-meyah-jade-500 bg-meyah-crema-100 text-meyah-jade-500 shadow-md">
        <ShoppingCart size={15} />
      </div>

      {/* Punto "Tú" con pulso */}
      <div className="absolute left-[29.5%] top-[70.5%] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-meyah-terracota-500/35 [animation-duration:2.4s]" />
        <span className="relative block h-4 w-4 rounded-full border-[3px] border-white bg-meyah-terracota-500 shadow-md" />
        <span
          className={cn(
            'absolute left-1/2 top-[22px] -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-[1.2] shadow-xs',
            dark ? 'bg-white text-meyah-tinta-900' : 'border border-meyah-border-soft bg-white text-meyah-tinta-900',
          )}
        >
          Tú
        </span>
      </div>

      {/* Mini-tarjeta de vacante de ejemplo */}
      {showCard && (
        <div className="absolute right-[6%] top-[12%] w-40 rounded-card border border-meyah-border-soft bg-white px-4 py-3 shadow-lg">
          <h3 className="font-display text-[15px] font-semibold leading-tight text-meyah-jade-900">Barista</h3>
          <p className="mt-1 text-[14px] font-bold text-meyah-jade-700">
            $7,500 <em className="text-[10.5px] font-medium not-italic text-meyah-tinta-400">/ mes</em>
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-meyah-jade-50 px-2 py-0.5 text-[10.5px] font-semibold text-meyah-jade-700">
            <MapPin size={10} /> a 1.2 km de ti
          </p>
        </div>
      )}
    </div>
  )
}
