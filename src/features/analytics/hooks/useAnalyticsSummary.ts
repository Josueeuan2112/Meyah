import { useMemo } from 'react'

import { useEmployerAnalytics } from '@/features/jobs/hooks/useEmployerAnalytics'
import { useEmployerDailyStats } from '@/features/jobs/hooks/useEmployerDailyStats'
import { useMyJobsProximity } from '@/features/jobs/hooks/useMyJobsProximity'
import type { EmployerAnalyticsRow } from '@/features/jobs/hooks/useEmployerAnalytics'

export type AnalyticsRange = 7 | 30 | 90

export interface KpiData {
  label: string
  value: string
  delta: number
  spark: number[]
  color: string
  icon: 'eye' | 'users' | 'percent' | 'file-check'
  help: string
}

export interface BestDay {
  day: string
  avg: number
  /** 0–1 normalized value for bar height */
  value: number
}

export interface AnalyticsSummary {
  daily: { day: string; views: number; applications: number }[]
  kpis: KpiData[]
  funnel: { views: number; apps: number; accepted: number }
  statusTotals: Record<string, number>
  totalAppsSnapshot: number
  bestDays: BestDay[]
  within3Pct: number
  totalCercanos: number
  analytics: EmployerAnalyticsRow[]
}

import { fmtN } from '@/features/analytics/lib/formatters'

function pctDelta(cur: number, prev: number): number {
  if (prev <= 0) return cur > 0 ? 100 : 0
  return ((cur - prev) / prev) * 100
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const

export function useAnalyticsSummary(range: AnalyticsRange) {
  // Fetch 2x range for period-over-period comparison
  const { data: dailyRaw, isLoading: dailyLoading, isError: dailyError } = useEmployerDailyStats(range * 2)
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useEmployerAnalytics()
  const { data: proximity } = useMyJobsProximity()

  const data = useMemo((): AnalyticsSummary | null => {
    if (!dailyRaw || !analytics) return null

    const daily = dailyRaw.slice(-range)
    const prev = dailyRaw.slice(0, dailyRaw.length - range)

    // Scale previous period if it has fewer data points (e.g., 90-day range
    // but only 120 days of history yields a 30-day prev instead of 90)
    const scale = prev.length > 0 ? range / prev.length : 1

    const sum = (arr: typeof daily, key: 'views' | 'applications') =>
      arr.reduce((s, d) => s + d[key], 0)

    const views = sum(daily, 'views')
    const apps = sum(daily, 'applications')
    const prevViews = sum(prev, 'views') * scale
    const prevApps = sum(prev, 'applications') * scale

    const conv = views > 0 ? (apps / views) * 100 : 0
    const prevConv = prevViews > 0 ? (prevApps / prevViews) * 100 : 0

    // Status aggregation from per-job analytics
    const statusTotals: Record<string, number> = {
      pendiente: 0, vista: 0, aceptada: 0, rechazada: 0,
    }
    let totalAppsSnapshot = 0
    for (const row of analytics) {
      const byStatus = row.applications_by_status as Record<string, number> | null
      if (byStatus) {
        for (const [k, v] of Object.entries(byStatus)) {
          statusTotals[k] = (statusTotals[k] || 0) + v
          totalAppsSnapshot += v
        }
      }
    }

    const acceptRate = totalAppsSnapshot > 0
      ? (statusTotals.aceptada / totalAppsSnapshot) * 100
      : 0
    const accepted = statusTotals.aceptada

    // Sparklines — last 14 data points of the current period
    const sparkSlice = daily.slice(-14)
    const viewsSpark = sparkSlice.map(d => d.views)
    const appsSpark = sparkSlice.map(d => d.applications)
    const convSpark = sparkSlice.map(d =>
      d.views > 0 ? (d.applications / d.views) * 100 : 0,
    )
    // Acceptance sparkline: static line approximation since we don't have
    // per-day status data — shows the overall rate as a flat reference
    const accSpark = sparkSlice.map(() => acceptRate)

    const kpis: KpiData[] = [
      {
        label: 'Vistas', value: fmtN(views), delta: pctDelta(views, prevViews),
        spark: viewsSpark, color: '#147068', icon: 'eye',
        help: 'Cuántas veces se mostraron tus vacantes en el periodo seleccionado.',
      },
      {
        label: 'Postulaciones', value: fmtN(apps), delta: pctDelta(apps, prevApps),
        spark: appsSpark, color: '#C84B31', icon: 'users',
        help: 'Candidatos que enviaron su postulación a alguna de tus vacantes.',
      },
      {
        label: 'Conversión', value: conv.toFixed(1) + '%', delta: pctDelta(conv, prevConv),
        spark: convSpark, color: '#1B998B', icon: 'percent',
        help: 'Porcentaje de vistas que terminan en postulación. Buen rango: 6–10%.',
      },
      {
        label: 'Aceptación', value: Math.round(acceptRate) + '%', delta: 0,
        spark: accSpark, color: '#147068', icon: 'file-check',
        help: 'De los postulantes recibidos, qué porcentaje aceptaste para el puesto.',
      },
    ]

    // Best days — group daily stats by day of week
    const dayBuckets = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }))
    for (const d of daily) {
      const dow = new Date(d.day + 'T12:00:00').getDay()
      dayBuckets[dow].total += d.applications
      dayBuckets[dow].count++
    }
    const bestDaysRaw = DAY_NAMES.map((name, i) => ({
      day: name,
      avg: dayBuckets[i].count > 0 ? dayBuckets[i].total / dayBuckets[i].count : 0,
    }))
    const maxDayAvg = Math.max(...bestDaysRaw.map(d => d.avg), 1)
    const bestDays: BestDay[] = bestDaysRaw.map(d => ({
      ...d,
      value: d.avg / maxDayAvg,
    }))

    // Proximity
    const totalCercanos = (proximity ?? []).reduce((s, p) => s + p.cercanos, 0)
    const within3Pct = totalAppsSnapshot > 0
      ? Math.round((totalCercanos / totalAppsSnapshot) * 100)
      : 0

    return {
      daily,
      kpis,
      funnel: { views, apps, accepted },
      statusTotals,
      totalAppsSnapshot,
      bestDays,
      within3Pct,
      totalCercanos,
      analytics,
    }
  }, [dailyRaw, analytics, proximity, range])

  return {
    data,
    isLoading: dailyLoading || analyticsLoading,
    isError: dailyError || analyticsError,
  }
}
