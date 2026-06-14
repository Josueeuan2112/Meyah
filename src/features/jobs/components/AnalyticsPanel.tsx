import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Eye, FileCheck, Loader2, TrendingUp, Users } from 'lucide-react'

import { useEmployerAnalytics } from '@/features/jobs/hooks/useEmployerAnalytics'
import { useEmployerDailyStats } from '@/features/jobs/hooks/useEmployerDailyStats'
import type { EmployerAnalyticsRow } from '@/features/jobs/hooks/useEmployerAnalytics'

// -- Helpers ------------------------------------------------------------------

/** "2026-06-14" -> "14/06" */
function formatDayLabel(iso: string): string {
  const parts = iso.split('-')
  return `${parts[2]}/${parts[1]}`
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return '0%'
  return `${Math.round((numerator / denominator) * 100)}%`
}

function acceptedCount(row: EmployerAnalyticsRow): number {
  const byStatus = row.applications_by_status as Record<string, number> | null
  return byStatus?.aceptada ?? 0
}

// -- Sub-components -----------------------------------------------------------

function DailyTrendsChart() {
  const { data, isLoading } = useEmployerDailyStats()

  const chartData = useMemo(
    () => (data ?? []).map(d => ({ label: formatDayLabel(d.day), vistas: d.views, postulaciones: d.applications })),
    [data],
  )

  if (isLoading) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <p className="py-12 text-center text-[14px] text-meyah-tinta-400">
        Sin datos de actividad aun.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gradVistas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#147068" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#147068" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradPostulaciones" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C84B31" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#C84B31" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e2dd" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, fontSize: 13, border: '1px solid #e5e2dd' }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="vistas"
          name="Vistas"
          stroke="#147068"
          strokeWidth={2}
          fill="url(#gradVistas)"
        />
        <Area
          type="monotone"
          dataKey="postulaciones"
          name="Postulaciones"
          stroke="#C84B31"
          strokeWidth={2}
          fill="url(#gradPostulaciones)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function FunnelMetrics({ analytics }: { analytics: EmployerAnalyticsRow[] }) {
  const totalViews = analytics.reduce((s, r) => s + r.views_total, 0)
  const totalApps = analytics.reduce((s, r) => s + r.applications_total, 0)
  const totalAccepted = analytics.reduce((s, r) => s + acceptedCount(r), 0)

  const steps = [
    { label: 'Vistas', value: totalViews, pctLabel: '100%', icon: Eye, color: 'bg-meyah-jade-500' },
    { label: 'Postulaciones', value: totalApps, pctLabel: pct(totalApps, totalViews), icon: Users, color: 'bg-meyah-terracota-500' },
    { label: 'Aceptadas', value: totalAccepted, pctLabel: pct(totalAccepted, totalViews), icon: FileCheck, color: 'bg-meyah-jade-900' },
  ]

  // Max bar width relative to first step (100%)
  const maxWidth = totalViews || 1

  return (
    <div className="space-y-3">
      {steps.map(step => {
        const Icon = step.icon
        const widthPct = Math.max((step.value / maxWidth) * 100, 4) // min 4% so zero isn't invisible
        return (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="inline-flex items-center gap-1.5 font-medium text-meyah-tinta-900">
                <Icon size={14} /> {step.label}
              </span>
              <span className="text-meyah-tinta-500">
                {step.value.toLocaleString('es-MX')} <span className="text-meyah-tinta-400">({step.pctLabel})</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-meyah-crema-100">
              <div
                className={`h-full rounded-full ${step.color} transition-all duration-500`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JobComparisonTable({ analytics }: { analytics: EmployerAnalyticsRow[] }) {
  if (analytics.length === 0) {
    return (
      <p className="py-8 text-center text-[14px] text-meyah-tinta-400">
        Publica vacantes para ver metricas por vacante.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full min-w-[480px] text-[13px]">
        <thead>
          <tr className="border-b border-meyah-border-soft text-left text-meyah-tinta-400">
            <th className="px-6 pb-2.5 font-medium">Vacante</th>
            <th className="px-3 pb-2.5 font-medium text-right">Vistas</th>
            <th className="px-3 pb-2.5 font-medium text-right">Postulaciones</th>
            <th className="px-6 pb-2.5 font-medium text-right">Tasa aceptacion</th>
          </tr>
        </thead>
        <tbody>
          {analytics.map(row => {
            const accepted = acceptedCount(row)
            const rate = row.applications_total > 0
              ? `${Math.round((accepted / row.applications_total) * 100)}%`
              : '--'
            return (
              <tr key={row.job_id} className="border-b border-meyah-border-soft last:border-0">
                <td className="px-6 py-3 font-medium text-meyah-tinta-900 max-w-[200px] truncate">
                  {row.job_titulo}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-meyah-tinta-600">
                  {row.views_total.toLocaleString('es-MX')}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-meyah-tinta-600">
                  {row.applications_total.toLocaleString('es-MX')}
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-meyah-tinta-600">{rate}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// -- Main panel ---------------------------------------------------------------

export default function AnalyticsPanel() {
  const { data: analytics, isLoading } = useEmployerAnalytics()

  if (isLoading) {
    return (
      <div className="mt-8 flex items-center justify-center py-12">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const rows = analytics ?? []

  return (
    <section className="mt-10 space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-meyah-jade-50 text-meyah-jade-700">
          <BarChart3 size={18} />
        </div>
        <div>
          <h2 className="font-display text-[22px] text-meyah-jade-900">Analiticas</h2>
          <p className="text-[13px] text-meyah-tinta-500">Ultimos 30 dias</p>
        </div>
      </div>

      {/* Daily trends chart */}
      <div className="rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-meyah-jade-600" />
          <h3 className="text-[15px] font-semibold text-meyah-tinta-900">Actividad diaria</h3>
        </div>
        {/* Color legend */}
        <div className="mb-3 flex gap-4 text-[12px] text-meyah-tinta-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-meyah-jade-500" /> Vistas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-meyah-terracota-500" /> Postulaciones
          </span>
        </div>
        <DailyTrendsChart />
      </div>

      {/* Funnel */}
      <div className="rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-[15px] font-semibold text-meyah-tinta-900">Embudo de conversion</h3>
        <FunnelMetrics analytics={rows} />
      </div>

      {/* Per-job table */}
      <div className="rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-[15px] font-semibold text-meyah-tinta-900">Rendimiento por vacante</h3>
        <JobComparisonTable analytics={rows} />
      </div>
    </section>
  )
}
