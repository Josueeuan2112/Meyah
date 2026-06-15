import { Briefcase, Info } from 'lucide-react'

import type { EmployerAnalyticsRow } from '@/features/jobs/hooks/useEmployerAnalytics'
import { ICON_BY_CATEGORY } from '@/features/jobs/schemas/categories'
import type { JobCategoryValue } from '@/features/jobs/schemas/categories'
import { fmtN } from '@/features/analytics/lib/formatters'

interface JobRow {
  job_id: string
  titulo: string
  views: number
  apps: number
  conv: number
  acceptRate: number | null
  health: { cls: string; label: string }
}

function healthOf(conv: number): { cls: string; label: string } {
  if (conv >= 0.12) return { cls: 'good', label: 'Saludable' }
  if (conv >= 0.05) return { cls: 'mid', label: 'Regular' }
  return { cls: 'low', label: 'Bajo interés' }
}

function buildRows(analytics: EmployerAnalyticsRow[]): JobRow[] {
  return analytics
    .map(row => {
      const byStatus = row.applications_by_status as Record<string, number> | null
      const accepted = byStatus?.aceptada ?? 0
      const conv = row.views_total > 0 ? row.applications_total / row.views_total : 0
      const acceptRate = row.applications_total > 0
        ? Math.round((accepted / row.applications_total) * 100)
        : null

      return {
        job_id: row.job_id,
        titulo: row.job_titulo,
        views: row.views_total,
        apps: row.applications_total,
        conv,
        acceptRate,
        health: healthOf(conv),
      }
    })
    .sort((a, b) => b.apps - a.apps)
}

const HEALTH_STYLES: Record<string, string> = {
  good: 'bg-meyah-jade-50 text-meyah-jade-700',
  mid: 'bg-meyah-crema-100 text-meyah-tinta-600',
  low: 'bg-meyah-terracota-50 text-meyah-terracota-700',
}

function HealthBadge({ health }: { health: JobRow['health'] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${HEALTH_STYLES[health.cls] ?? HEALTH_STYLES.mid}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {health.label}
    </span>
  )
}

interface JobPerformanceCardProps {
  analytics: EmployerAnalyticsRow[]
}

export default function JobPerformanceCard({ analytics }: JobPerformanceCardProps) {
  const rows = buildRows(analytics)
  const maxConv = Math.max(...rows.map(r => r.conv), 0.0001)

  if (rows.length === 0) {
    return (
      <div className="rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm lg:p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-meyah-jade-600"><Briefcase size={16} /></span>
          <h3 className="text-[15px] font-semibold text-meyah-tinta-900">Rendimiento por vacante</h3>
        </div>
        <p className="py-8 text-center text-[14px] text-meyah-tinta-400">
          Publica vacantes para ver métricas por vacante.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm lg:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-meyah-jade-600"><Briefcase size={16} /></span>
        <h3 className="text-[15px] font-semibold text-meyah-tinta-900">Rendimiento por vacante</h3>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {rows.map(row => {
          const CatIcon = ICON_BY_CATEGORY[row.titulo as JobCategoryValue] ?? ICON_BY_CATEGORY.otro
          return (
            <div
              key={row.job_id}
              className="rounded-card border border-meyah-border-soft bg-white p-3.5 transition-shadow hover:shadow-sm"
            >
              {/* Head */}
              <div className="flex items-start gap-2.5">
                <span className="grid h-9.5 w-9.5 flex-none place-items-center rounded-[11px] bg-meyah-jade-50 text-meyah-jade-700">
                  <CatIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[16px] text-meyah-jade-900">
                    {row.titulo}
                  </div>
                </div>
                <HealthBadge health={row.health} />
              </div>

              {/* Metrics grid */}
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-meyah-border-soft pt-3">
                <div>
                  <div className="text-[16px] font-bold tabular-nums text-meyah-tinta-900">
                    {fmtN(row.views)}
                  </div>
                  <div className="text-[11px] text-meyah-tinta-400">vistas</div>
                </div>
                <div>
                  <div className="text-[16px] font-bold tabular-nums text-meyah-tinta-900">
                    {fmtN(row.apps)}
                  </div>
                  <div className="text-[11px] text-meyah-tinta-400">postulaciones</div>
                </div>
                <div>
                  <div className="text-[16px] font-bold tabular-nums text-meyah-tinta-900">
                    {row.acceptRate != null ? `${row.acceptRate}%` : '—'}
                  </div>
                  <div className="text-[11px] text-meyah-tinta-400">aceptación</div>
                </div>
              </div>

              {/* Conversion bar */}
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11.5px] text-meyah-tinta-400">
                  <span>Conversión</span>
                  <b className="text-meyah-tinta-900">{(row.conv * 100).toFixed(1)}%</b>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-meyah-crema-100">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(row.conv / maxConv) * 100}%`,
                      background: row.health.cls === 'low' ? '#C84B31' : '#1B998B',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block -mx-6 overflow-x-auto">
        <table className="w-full min-w-[600px] text-[13.5px]">
          <thead>
            <tr className="border-b border-meyah-border-soft text-left text-[12.5px] font-medium text-meyah-tinta-400">
              <th className="px-6 pb-3">Vacante</th>
              <th className="px-3 pb-3 text-right">Vistas</th>
              <th className="px-3 pb-3 text-right">Postulaciones</th>
              <th className="px-3 pb-3">Conversión</th>
              <th className="px-3 pb-3 text-right">Aceptación</th>
              <th className="px-6 pb-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.job_id} className="border-b border-meyah-border-soft last:border-0">
                <td className="max-w-[240px] truncate px-6 py-3.5 font-semibold text-meyah-tinta-900">
                  {row.titulo}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums text-meyah-tinta-600">
                  {fmtN(row.views)}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums text-meyah-tinta-600">
                  {fmtN(row.apps)}
                </td>
                <td className="px-3 py-3.5 tabular-nums text-meyah-tinta-600">
                  {(row.conv * 100).toFixed(1)}%
                  <span className="ml-2 inline-block h-1.5 w-[90px] overflow-hidden rounded-full bg-meyah-crema-100 align-middle">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${(row.conv / maxConv) * 100}%`,
                        background: row.health.cls === 'low'
                          ? 'var(--color-meyah-terracota-500)'
                          : 'var(--color-meyah-jade-500)',
                      }}
                    />
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums text-meyah-tinta-600">
                  {row.acceptRate != null ? `${row.acceptRate}%` : '—'}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <HealthBadge health={row.health} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insight note */}
      {rows.some(r => r.health.cls === 'low') && (
        <div className="mt-3.5 flex gap-2 rounded-field border border-meyah-border-soft bg-meyah-terracota-50 p-2.5 text-[12.5px] leading-relaxed text-meyah-tinta-600">
          <span className="mt-0.5 flex-none text-meyah-terracota-500"><Info size={14} /></span>
          <span>
            Algunas vacantes tienen conversión baja. Revisa el título, sueldo publicado o los requisitos
            para mejorar la atracción de candidatos.
          </span>
        </div>
      )}
    </div>
  )
}
