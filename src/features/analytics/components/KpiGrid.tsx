import { ArrowDown, ArrowUp, Eye, FileCheck, Percent, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { KpiData } from '@/features/analytics/hooks/useAnalyticsSummary'
import Sparkline from '@/features/analytics/components/Sparkline'

const ICON_MAP: Record<KpiData['icon'], LucideIcon> = {
  eye: Eye,
  users: Users,
  percent: Percent,
  'file-check': FileCheck,
}

function Delta({ value }: { value: number }) {
  const isUp = value > 0.5
  const isDown = value < -0.5
  const label = `${value > 0 ? '+' : ''}${Math.round(value)}%`

  if (!isUp && !isDown) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-meyah-crema-100 px-1.5 py-0.5 text-[12px] font-bold text-meyah-tinta-400">
        {label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[12px] font-bold ${
        isUp
          ? 'bg-meyah-jade-50 text-meyah-jade-700'
          : 'bg-meyah-terracota-50 text-meyah-terracota-700'
      }`}
    >
      {isUp ? <ArrowUp size={11} strokeWidth={2.6} /> : <ArrowDown size={11} strokeWidth={2.6} />}
      {label}
    </span>
  )
}

interface KpiGridProps {
  kpis: KpiData[]
}

export default function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {kpis.map(kpi => {
        const Icon = ICON_MAP[kpi.icon]
        return (
          <div
            key={kpi.label}
            className="relative overflow-hidden rounded-card border border-meyah-border-soft bg-white p-3.5 shadow-sm lg:p-4.5"
          >
            {/* Top row: icon + label + help */}
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-meyah-tinta-600">
              <span className="text-meyah-jade-600">
                <Icon size={15} />
              </span>
              {kpi.label}
              <span
                className="ml-auto grid h-4 w-4 flex-none cursor-help place-items-center rounded-full bg-meyah-crema-100 text-[10px] font-bold text-meyah-tinta-400"
                title={kpi.help}
              >
                ?
              </span>
            </div>

            {/* Value */}
            <div className="mt-2 font-display text-[28px] font-semibold leading-none text-meyah-jade-900 lg:text-[32px]">
              {kpi.value}
            </div>

            {/* Bottom row: delta + sparkline */}
            <div className="mt-2 flex items-end justify-between gap-1.5">
              <Delta value={kpi.delta} />
              <Sparkline points={kpi.spark} color={kpi.color} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
