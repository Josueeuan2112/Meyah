import { Link } from 'react-router'

import type { MyApplication } from '@/features/applications/hooks/useMyApplications'
import { APPLICATION_STATUS_LABEL } from '@/features/applications/constants'

const BADGE_CLASS: Record<MyApplication['estado'], string> = {
  pendiente: 'bg-meyah-crema-100 text-meyah-tinta-700',
  vista:     'bg-meyah-jade-50 text-meyah-jade-700',
  aceptada:  'bg-meyah-jade-500 text-white',
  rechazada: 'bg-meyah-terracota-50 text-meyah-terracota-700',
}

interface ApplicationCardProps {
  application: MyApplication
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const date = new Date(application.created_at).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="border border-meyah-tinta-600/10 rounded-xl p-5 bg-meyah-crema-100 space-y-2">

      <Link
        to={`/vacante/${application.job.id}`}
        className="block font-display font-semibold text-meyah-jade-900 hover:underline leading-snug"
      >
        {application.job.titulo}
      </Link>

      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_CLASS[application.estado]}`}
        >
          {APPLICATION_STATUS_LABEL[application.estado]}
        </span>
        {application.job.estado === 'cerrada' && (
          <span className="text-xs text-meyah-tinta-600/60">Vacante cerrada</span>
        )}
      </div>

      <p className="text-xs text-meyah-tinta-600">Postulado el {date}</p>

    </div>
  )
}
