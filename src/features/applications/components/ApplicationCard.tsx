import { Link } from 'react-router'
import { Clock } from 'lucide-react'

import { ICON_BY_CATEGORY, JOB_CATEGORIES } from '@/features/jobs/schemas/categories'
import type { JobCategoryValue } from '@/features/jobs/schemas/categories'
import { formatSalary } from '@/shared/lib/formatSalary'
import { APPLICATION_STATUS_BADGE_CLASS, APPLICATION_STATUS_LABEL } from '../constants'
import type { MyApplication } from '../hooks/useMyApplications'

const fechaFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

export function ApplicationCard({ app }: { app: MyApplication }) {
  const { job } = app
  const label = JOB_CATEGORIES.find(c => c.value === job.categoria)?.label ?? job.categoria
  const Icon = ICON_BY_CATEGORY[job.categoria as JobCategoryValue] ?? ICON_BY_CATEGORY.otro
  const cerrada = job.estado === 'cerrada'

  return (
    <article className="group relative flex gap-6 rounded-card border border-meyah-border-soft bg-white p-7 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid h-16 w-16 flex-none place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700">
        <Icon size={24} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[22px] font-semibold leading-[1.18] text-meyah-jade-900">
              <Link to={`/vacante/${job.id}`} className="hover:underline">{job.titulo}</Link>
            </h3>
            <p className="mt-0.75 truncate text-[14px] text-meyah-tinta-600">
              {job.company?.nombre ?? 'Empresa'} · {label}{cerrada && <span className="text-meyah-terracota-700"> · Vacante cerrada</span>}
            </p>
          </div>
          <span className={`flex-none whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${APPLICATION_STATUS_BADGE_CLASS[app.estado]}`}>
            {APPLICATION_STATUS_LABEL[app.estado]}
          </span>
        </div>
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-meyah-border-soft pt-3.5">
          <span className="inline-flex items-center gap-1.5 text-[13.5px] text-meyah-tinta-400">
            <Clock size={14} /> Postulado el {fechaFmt.format(new Date(app.created_at))}
          </span>
          <span className="text-[14px] font-bold text-meyah-jade-700">{formatSalary(job.salario_min, job.salario_max)}</span>
        </div>
      </div>
    </article>
  )
}
