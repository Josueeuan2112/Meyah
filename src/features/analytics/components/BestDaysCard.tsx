import { Calendar, Info } from 'lucide-react'

import type { BestDay } from '@/features/analytics/hooks/useAnalyticsSummary'

const DAY_FULL: Record<string, string> = {
  Dom: 'domingos',
  Lun: 'lunes',
  Mar: 'martes',
  Mié: 'miércoles',
  Jue: 'jueves',
  Vie: 'viernes',
  Sáb: 'sábados',
}

interface BestDaysCardProps {
  bestDays: BestDay[]
}

export default function BestDaysCard({ bestDays }: BestDaysCardProps) {
  const topDay = bestDays.reduce(
    (best, d) => (d.avg > best.avg ? d : best),
    bestDays[0],
  )

  return (
    <div className="rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm lg:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-meyah-jade-600"><Calendar size={16} /></span>
        <h3 className="text-[15px] font-semibold text-meyah-tinta-900">Mejores días para postulaciones</h3>
      </div>

      {/* Bar chart */}
      <div className="mt-2.5 flex items-end gap-2" style={{ height: 130 }}>
        {bestDays.map(d => {
          const isTop = d.day === topDay.day
          return (
            <div
              key={d.day}
              className="flex flex-1 flex-col items-center gap-1.5"
              style={{ height: '100%' }}
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-[7px] transition-all duration-500 ${isTop ? 'bg-meyah-jade-500' : 'bg-meyah-jade-100'}`}
                  style={{ height: `${Math.max(d.value * 100, 8)}%` }}
                  title={`${Math.round(d.avg * 10) / 10} postulaciones/día`}
                />
              </div>
              <span
                className={`text-[11.5px] ${
                  isTop
                    ? 'font-bold text-meyah-jade-700'
                    : 'font-medium text-meyah-tinta-400'
                }`}
              >
                {d.day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Insight note */}
      {topDay.avg > 0 && (
        <div className="mt-3.5 flex gap-2 rounded-field border border-meyah-border-soft bg-meyah-crema-50 p-2.5 text-[12.5px] leading-relaxed text-meyah-tinta-600">
          <span className="mt-0.5 flex-none text-meyah-jade-600"><Info size={14} /></span>
          <span>
            Los <b className="text-meyah-tinta-900">{DAY_FULL[topDay.day] ?? topDay.day}</b>{' '}
            concentran más postulaciones. Publica o renueva a inicio de semana para aprovechar el pico.
          </span>
        </div>
      )}
    </div>
  )
}
