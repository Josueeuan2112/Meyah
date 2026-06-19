import { lazy, Suspense, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'

import { useAnalyticsSummary } from '@/features/analytics/hooks/useAnalyticsSummary'
import type { AnalyticsRange } from '@/features/analytics/hooks/useAnalyticsSummary'
import RangeSelector from '@/features/analytics/components/RangeSelector'
import KpiGrid from '@/features/analytics/components/KpiGrid'
// Recharts (~101 KB gzip) se difiere para que los KPIs/tablas pinten primero.
const ActivityChart = lazy(() => import('@/features/analytics/components/ActivityChart'))
import FunnelCard from '@/features/analytics/components/FunnelCard'
import StatusCard from '@/features/analytics/components/StatusCard'
import ProximityCard from '@/features/analytics/components/ProximityCard'
import BestDaysCard from '@/features/analytics/components/BestDaysCard'
import JobPerformanceCard from '@/features/analytics/components/JobPerformanceCard'

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>(30)
  const { data, isLoading, isError } = useAnalyticsSummary(range)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-meyah-jade-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-[14px] text-meyah-tinta-400">
          No se pudieron cargar las analíticas. Intenta de nuevo.
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-[14px] text-meyah-tinta-400">
          Publica vacantes para ver tus analíticas.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-295 px-4 py-8 sm:px-6">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start gap-3">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-meyah-jade-50 text-meyah-jade-700">
            <BarChart3 size={20} />
          </div>
          <div className="flex-1">
            <h1 className="text-[clamp(24px,4vw,30px)]">Analíticas</h1>
            <p className="text-[13px] text-meyah-tinta-400">
              Últimos {range} días · actualizado hoy
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <RangeSelector value={range} onChange={setRange} />
          </div>
        </div>

        {/* KPI Grid */}
        <div className="mb-4 lg:mb-5">
          <KpiGrid kpis={data.kpis} />
        </div>

        {/* Activity Chart */}
        <div className="mb-4 lg:mb-5">
          <Suspense
            fallback={
              <div className="flex h-75 items-center justify-center rounded-panel border border-meyah-border-soft bg-white shadow-sm">
                <Loader2 className="size-6 animate-spin text-meyah-jade-500" />
              </div>
            }
          >
            <ActivityChart daily={data.daily} />
          </Suspense>
        </div>

        {/* Funnel + Status (2-column on desktop) */}
        <div className="mb-4 grid gap-4 lg:mb-5 lg:grid-cols-2 lg:gap-5">
          <FunnelCard
            views={data.funnel.views}
            apps={data.funnel.apps}
            accepted={data.funnel.accepted}
          />
          <StatusCard
            statusTotals={data.statusTotals}
            total={data.totalAppsSnapshot}
          />
        </div>

        {/* Proximity + Best Days (2-column on desktop) */}
        <div className="mb-4 grid gap-4 lg:mb-5 lg:grid-cols-2 lg:gap-5">
          <ProximityCard
            within3Pct={data.within3Pct}
            totalCercanos={data.totalCercanos}
            totalApps={data.totalAppsSnapshot}
          />
          <BestDaysCard bestDays={data.bestDays} />
        </div>

        {/* Job Performance */}
        <div className="mb-4 lg:mb-5">
          <JobPerformanceCard analytics={data.analytics} />
        </div>

      </div>
    </div>
  )
}
