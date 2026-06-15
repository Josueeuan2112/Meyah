import { Info, Users } from 'lucide-react'

import { fmtN } from '@/features/analytics/lib/formatters'

const STATUS_META = [
  { key: 'pendiente', label: 'Pendiente', color: '#C9C0B0' },
  { key: 'vista', label: 'Vista', color: '#C84B31' },
  { key: 'aceptada', label: 'Aceptada', color: '#1B998B' },
  { key: 'rechazada', label: 'Rechazada', color: '#B8AFA2' },
] as const

interface StatusCardProps {
  statusTotals: Record<string, number>
  total: number
}

/** SVG donut chart — precomputes offsets to avoid mutating during render */
function Donut({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
  const r = 52
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1

  // Precompute fractions and cumulative offsets
  const arcs = segments.reduce<{ frac: number; offset: number; color: string }[]>(
    (acc, seg) => {
      const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].frac : 0
      acc.push({ frac: seg.value / sum, offset: prevOffset, color: seg.color })
      return acc
    },
    [],
  )

  return (
    <div className="relative h-[150px] w-[150px] flex-none lg:h-[168px] lg:w-[168px]">
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F2EDE3" strokeWidth={15} />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={15}
            strokeDasharray={`${arc.frac * circumference} ${circumference - arc.frac * circumference}`}
            strokeDashoffset={-arc.offset * circumference}
            transform="rotate(-90 60 60)"
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="font-display text-[28px] font-semibold leading-none text-meyah-jade-900 lg:text-[30px]">
          {fmtN(total)}
        </div>
        <div className="mt-0.5 text-[11px] text-meyah-tinta-400">postulantes</div>
      </div>
    </div>
  )
}

export default function StatusCard({ statusTotals, total }: StatusCardProps) {
  const segments = STATUS_META.map(m => ({
    value: statusTotals[m.key] || 0,
    color: m.color,
  }))

  const pendientes = statusTotals.pendiente || 0

  return (
    <div className="rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm lg:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-meyah-jade-600"><Users size={16} /></span>
        <h3 className="text-[15px] font-semibold text-meyah-tinta-900">Estado de postulaciones</h3>
      </div>

      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-6">
        <Donut segments={segments} total={total} />

        {/* Legend */}
        <div className="grid w-full grid-cols-2 gap-2.5">
          {STATUS_META.map(m => (
            <div
              key={m.key}
              className="flex items-center gap-2.5 rounded-field border border-meyah-border-soft bg-meyah-crema-50 px-2.5 py-2 text-[13px]"
            >
              <span
                className="h-2.75 w-2.75 flex-none rounded-[4px]"
                style={{ background: m.color }}
              />
              <span className="text-meyah-tinta-600">{m.label}</span>
              <span className="ml-auto tabular-nums font-bold text-meyah-tinta-900">
                {fmtN(statusTotals[m.key] || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight note */}
      {pendientes > 0 && (
        <div className="mt-3.5 flex gap-2 rounded-field border border-meyah-border-soft bg-meyah-crema-50 p-2.5 text-[12.5px] leading-relaxed text-meyah-tinta-600">
          <span className="mt-0.5 flex-none text-meyah-jade-600"><Info size={14} /></span>
          <span>
            Tienes <b className="text-meyah-tinta-900">{fmtN(pendientes)} postulaciones pendientes</b> sin revisar.
            Responder a tiempo mejora tu reputación con los candidatos.
          </span>
        </div>
      )}
    </div>
  )
}
