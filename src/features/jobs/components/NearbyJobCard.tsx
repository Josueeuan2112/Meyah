import { Link } from 'react-router'
import { MapPin } from 'lucide-react'

import { formatDistance } from '@/shared/lib/formatDistance'
import type { NearbyJob } from '@/features/jobs/hooks/useNearbyJobs'
import { JOB_CATEGORIES } from '@/features/jobs/schemas/categories'

const fmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

interface NearbyJobCardProps {
  job: NearbyJob
}

export default function NearbyJobCard({ job }: NearbyJobCardProps) {
  const distance = formatDistance(job.distancia_m)
  const categoriaLabel =
    JOB_CATEGORIES.find(c => c.value === job.categoria)?.label ?? job.categoria

  const salarioText =
    job.salario_min != null && job.salario_max != null
      ? `${fmt.format(job.salario_min)} – ${fmt.format(job.salario_max)}`
      : job.salario_min != null
        ? fmt.format(job.salario_min)
        : job.salario_max != null
          ? fmt.format(job.salario_max)
          : '—'

  return (
    <Link
      to={`/vacante/${job.id}`}
      className="block rounded-2xl border border-meyah-tinta-600/10 bg-white p-5 transition hover:border-meyah-jade-500/40 hover:shadow-sm"
    >
      {/* Fila superior */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-meyah-tinta-900 leading-snug">
            {job.titulo}
          </p>
          <p className="text-sm text-meyah-tinta-600 mt-0.5 truncate">
            {job.company_nombre}
          </p>
        </div>

        {distance !== null && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-meyah-jade-50 px-2.5 py-1 text-xs font-medium text-meyah-jade-700">
            <MapPin size={12} aria-hidden="true" />
            {distance}
          </span>
        )}
      </div>

      {/* Fila inferior */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-meyah-tinta-900">{salarioText}</p>
        <span className="rounded-full bg-meyah-terracota-50 px-2.5 py-1 text-xs font-medium text-meyah-terracota-700">
          {categoriaLabel}
        </span>
      </div>
    </Link>
  )
}
