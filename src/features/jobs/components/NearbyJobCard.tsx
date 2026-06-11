import { MapPin } from 'lucide-react'

import { JOB_CATEGORIES, ICON_BY_CATEGORY } from '@/features/jobs/schemas/categories'
import type { JobCategoryValue } from '@/features/jobs/schemas/categories'
import { formatDistance } from '@/shared/lib/formatDistance'
import { formatSalary } from '@/shared/lib/formatSalary'
import type { NearbyJob } from '@/features/jobs/hooks/useNearbyJobs'

interface NearbyJobCardProps {
  job: NearbyJob
  onSelect: () => void
}

export default function NearbyJobCard({ job, onSelect }: NearbyJobCardProps) {
  const label = JOB_CATEGORIES.find(c => c.value === job.categoria)?.label ?? job.categoria
  const Icon = ICON_BY_CATEGORY[job.categoria as JobCategoryValue] ?? ICON_BY_CATEGORY.otro
  const dist = formatDistance(job.distancia_m)
  const sal = formatSalary(job.salario_min, job.salario_max)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex w-full gap-4 rounded-card border border-meyah-border-soft bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-meyah-border hover:shadow-md sm:p-4.5"
    >
      <div className="grid h-12 w-12 flex-none place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700 transition group-hover:bg-meyah-jade-500 group-hover:text-white">
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-display text-[18px] font-semibold leading-[1.18] text-meyah-jade-900">{job.titulo}</h3>
            <p className="mt-px truncate text-[13.5px] text-meyah-tinta-600">{job.company_nombre}</p>
          </div>
          {dist && (
            <span className="inline-flex flex-none items-center gap-0.75 rounded-full bg-meyah-jade-50 px-2.25 py-1 text-[12.5px] font-semibold text-meyah-jade-700">
              <MapPin size={13} /> {dist}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.25 text-[16px] font-bold text-meyah-tinta-900">
          {sal}{sal !== '—' && <em className="text-[12px] font-medium not-italic text-meyah-tinta-400">/ mes</em>}
        </div>
        <div className="mt-2.75 text-[12.5px] font-semibold text-meyah-jade-700">{label}</div>
      </div>
    </button>
  )
}
