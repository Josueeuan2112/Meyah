import { Info, MapPin, Route } from 'lucide-react'

import { fmtN } from '@/features/analytics/lib/formatters'

interface ProximityCardProps {
  within3Pct: number
  totalCercanos: number
  totalApps: number
}

export default function ProximityCard({ within3Pct, totalCercanos, totalApps }: ProximityCardProps) {
  const beyond3 = Math.max(totalApps - totalCercanos, 0)
  const beyond3Pct = totalApps > 0 ? 100 - within3Pct : 0

  const bars = [
    { label: '< 3 km', value: totalCercanos, pct: within3Pct, color: 'bg-meyah-jade-500' },
    { label: '+ 3 km', value: beyond3, pct: beyond3Pct, color: 'bg-meyah-terracota-500' },
  ]

  const max = Math.max(totalCercanos, beyond3, 1)

  return (
    <div className="rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm lg:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-meyah-jade-600"><Route size={16} /></span>
        <h3 className="text-[15px] font-semibold text-meyah-tinta-900">Cercanía de tus postulantes</h3>
      </div>

      {/* Hero banner */}
      <div className="greca relative mb-4 flex items-center gap-3.5 overflow-hidden rounded-card bg-meyah-jade-900 p-3.5 text-white">
        <span className="relative z-10 grid h-11 w-11 flex-none place-items-center rounded-[13px] bg-white/12">
          <MapPin size={22} />
        </span>
        <div className="relative z-10">
          <div className="font-display text-[32px] font-semibold leading-none">
            {within3Pct}%
          </div>
          <div className="mt-0.5 text-[12.5px] text-white/78">
            de tus postulantes vive a menos de 3 km del trabajo
          </div>
        </div>
      </div>

      {/* Distance bars */}
      <div className="space-y-3">
        {bars.map(bar => (
          <div key={bar.label} className="flex items-center gap-2.5">
            <span className="w-14 flex-none text-[12.5px] font-semibold text-meyah-tinta-900">
              {bar.label}
            </span>
            <span className="h-5.5 flex-1 overflow-hidden rounded-lg bg-meyah-crema-100">
              <span
                className={`block h-full rounded-lg ${bar.color} transition-all duration-700`}
                style={{ width: `${max > 0 ? (bar.value / max) * 100 : 0}%` }}
              />
            </span>
            <span className="w-20 flex-none text-right text-[12.5px] tabular-nums text-meyah-tinta-600">
              <b className="text-meyah-tinta-900">{fmtN(bar.value)}</b>{' '}
              ({bar.pct}%)
            </span>
          </div>
        ))}
      </div>

      {/* Insight note */}
      <div className="mt-3.5 flex gap-2 rounded-field border border-meyah-border-soft bg-meyah-crema-50 p-2.5 text-[12.5px] leading-relaxed text-meyah-tinta-600">
        <span className="mt-0.5 flex-none text-meyah-jade-600"><Info size={14} /></span>
        <span>
          La cercanía es la ventaja de Meyah: los candidatos cercanos{' '}
          <b className="text-meyah-tinta-900">aceptan más rápido y duran más</b> en el puesto.
        </span>
      </div>
    </div>
  )
}
