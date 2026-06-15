import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Info, TrendingUp } from 'lucide-react'

import { fmtN } from '@/features/analytics/lib/formatters'

interface DailyRow {
  day: string
  views: number
  applications: number
}

function formatDayLabel(iso: string): string {
  const parts = iso.split('-')
  return `${parts[2]}/${parts[1]}`
}

interface ActivityChartProps {
  daily: DailyRow[]
}

export default function ActivityChart({ daily }: ActivityChartProps) {
  const [show, setShow] = useState({ vistas: true, postulaciones: true })

  const toggle = (key: 'vistas' | 'postulaciones') => {
    setShow(prev => {
      const next = { ...prev, [key]: !prev[key] }
      // Always keep at least one series visible
      if (!next.vistas && !next.postulaciones) return prev
      return next
    })
  }

  const totalViews = daily.reduce((s, d) => s + d.views, 0)
  const totalApps = daily.reduce((s, d) => s + d.applications, 0)

  const chartData = daily.map(d => ({
    label: formatDayLabel(d.day),
    vistas: d.views,
    postulaciones: d.applications,
  }))

  // Find best day for the note
  const bestDay = daily.reduce(
    (best, d) => (d.applications > best.applications ? d : best),
    daily[0],
  )

  return (
    <div className="rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm lg:p-6">
      {/* Header */}
      <div className="mb-1 flex items-center gap-2">
        <span className="text-meyah-jade-600"><TrendingUp size={16} /></span>
        <h3 className="text-[15px] font-semibold text-meyah-tinta-900">Actividad diaria</h3>
      </div>

      {/* Legend (toggleable) */}
      <div className="mb-2.5 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => toggle('vistas')}
          aria-pressed={show.vistas}
          className={`inline-flex items-center gap-1.5 text-[12.5px] transition-opacity ${
            show.vistas ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-meyah-jade-700" />
          <span className="text-meyah-tinta-600">Vistas</span>
          <b className="ml-1 tabular-nums text-meyah-jade-700">{fmtN(totalViews)}</b>
        </button>
        <button
          type="button"
          onClick={() => toggle('postulaciones')}
          aria-pressed={show.postulaciones}
          className={`inline-flex items-center gap-1.5 text-[12.5px] transition-opacity ${
            show.postulaciones ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-meyah-terracota-500" />
          <span className="text-meyah-tinta-600">Postulaciones</span>
          <b className="ml-1 tabular-nums text-meyah-terracota-700">{fmtN(totalApps)}</b>
        </button>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <p className="py-12 text-center text-[14px] text-meyah-tinta-400">
          Sin datos de actividad aún.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="anGradVistas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#147068" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#147068" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="anGradPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C84B31" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#C84B31" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ECE6DB" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10.5 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10.5 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                fontSize: 13,
                border: '1px solid #EFE9DE',
                boxShadow: '0 8px 28px -8px rgba(45,42,38,.12)',
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            {show.vistas && (
              <Area
                type="monotone"
                dataKey="vistas"
                name="Vistas"
                stroke="#147068"
                strokeWidth={2.2}
                fill="url(#anGradVistas)"
              />
            )}
            {show.postulaciones && (
              <Area
                type="monotone"
                dataKey="postulaciones"
                name="Postulaciones"
                stroke="#C84B31"
                strokeWidth={2.2}
                fill="url(#anGradPosts)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Insight note */}
      {bestDay && bestDay.applications > 0 && (
        <div className="mt-3.5 flex gap-2 rounded-field border border-meyah-border-soft bg-meyah-crema-50 p-2.5 text-[12.5px] leading-relaxed text-meyah-tinta-600">
          <span className="mt-0.5 flex-none text-meyah-jade-600"><Info size={14} /></span>
          <span>
            Tu día más activo fue el{' '}
            <b className="text-meyah-tinta-900">{formatDayLabel(bestDay.day)}</b> con{' '}
            <b className="text-meyah-tinta-900">{bestDay.applications} postulaciones</b>.
            Toca la leyenda para aislar una métrica.
          </span>
        </div>
      )}
    </div>
  )
}
