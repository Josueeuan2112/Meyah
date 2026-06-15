import { Eye, FileCheck, Info, Target, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { fmtN } from '@/features/analytics/lib/formatters'

interface FunnelStep {
  label: string
  value: number
  icon: LucideIcon
  color: string
}

interface FunnelCardProps {
  views: number
  apps: number
  accepted: number
}

export default function FunnelCard({ views, apps, accepted }: FunnelCardProps) {
  const steps: FunnelStep[] = [
    { label: 'Vistas', value: views, icon: Eye, color: 'bg-meyah-jade-500' },
    { label: 'Postulaciones', value: apps, icon: Users, color: 'bg-meyah-terracota-500' },
    { label: 'Aceptadas', value: accepted, icon: FileCheck, color: 'bg-meyah-jade-900' },
  ]

  const max = views || 1
  const convApp = views > 0 ? (apps / views) * 100 : 0
  const convAcc = apps > 0 ? (accepted / apps) * 100 : 0

  const drops = [
    `${convApp.toFixed(1)}% de las vistas se postulan`,
    `${Math.round(convAcc)}% de los postulantes son aceptados`,
  ]

  return (
    <div className="rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm lg:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-meyah-jade-600"><Target size={16} /></span>
        <h3 className="text-[15px] font-semibold text-meyah-tinta-900">Embudo de conversión</h3>
      </div>

      <div className="flex flex-col gap-1">
        {steps.map((step, i) => {
          const Icon = step.icon
          const widthPct = Math.max((step.value / max) * 100, 3)
          return (
            <div key={step.label}>
              {/* Step */}
              <div className="py-0.5">
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-meyah-tinta-900">
                    <span className="text-meyah-tinta-400"><Icon size={14} /></span>
                    {step.label}
                  </span>
                  <span className="tabular-nums text-meyah-tinta-600">
                    <b className="text-meyah-tinta-900">{fmtN(step.value)}</b>
                    {i > 0 && (
                      <span className="text-meyah-tinta-400">
                        {' '}· {Math.round((step.value / max) * 100)}% del total
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-meyah-crema-100">
                  <div
                    className={`h-full rounded-full ${step.color} transition-all duration-700`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>

              {/* Drop annotation */}
              {i < steps.length - 1 && (
                <div className="ml-6 flex items-center gap-1.5 py-0.5 text-[11.5px] text-meyah-tinta-400">
                  <span className="h-3.5 w-3.5 rounded-bl border-b border-l border-dashed border-meyah-border" />
                  {drops[i]}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Insight note */}
      <div className="mt-3.5 flex gap-2 rounded-field border border-meyah-border-soft bg-meyah-crema-50 p-2.5 text-[12.5px] leading-relaxed text-meyah-tinta-600">
        <span className="mt-0.5 flex-none text-meyah-jade-600"><Info size={14} /></span>
        <span>
          De cada 100 personas que ven tus vacantes,{' '}
          <b className="text-meyah-tinta-900">{Math.round(convApp)} se postulan</b>.
          Una tasa sana ronda el 6–10%.
        </span>
      </div>
    </div>
  )
}
