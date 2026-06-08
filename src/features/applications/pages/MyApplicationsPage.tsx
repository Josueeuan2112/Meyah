import { Loader2 } from 'lucide-react'

import { useMyApplications } from '@/features/applications/hooks/useMyApplications'
import ApplicationCard from '@/features/applications/components/ApplicationCard'

export default function MyApplicationsPage() {
  const { data, isLoading, isError } = useMyApplications()

  // Estado: cargando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Estado: error
  if (isError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">
          No se pudieron cargar tus postulaciones. Intenta de nuevo.
        </p>
      </div>
    )
  }

  // Estado: vacío
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">
          Aún no te has postulado a ninguna vacante.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">

      <div className="mb-8">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-meyah-terracota-700">
          TUS CANDIDATURAS
        </span>
        <h1 className="font-display text-3xl md:text-4xl text-meyah-jade-900 mt-3">
          Mis postulaciones
        </h1>
      </div>

      <div className="space-y-4">
        {data.map(app => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>

    </div>
  )
}
