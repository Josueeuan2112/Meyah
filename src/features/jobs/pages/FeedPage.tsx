import { Link } from 'react-router'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNearbyJobs } from '@/features/jobs/hooks/useNearbyJobs'
import NearbyJobCard from '@/features/jobs/components/NearbyJobCard'

export default function FeedPage() {
  const { profile } = useAuth()
  const { data, isPending, isError } = useNearbyJobs()

  const hasLocation = profile?.lat_referencia != null

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8">

      {/* Encabezado */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-meyah-tinta-900">
          {hasLocation ? 'Vacantes cerca de ti' : 'Explora vacantes'}
        </h1>
        {hasLocation && (
          <p className="text-sm text-meyah-tinta-600 mt-1">
            Ordenadas por distancia desde tu ubicación de referencia.
          </p>
        )}
      </div>

      {/* Aviso de ubicación no configurada */}
      {!hasLocation && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-meyah-crema-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-meyah-tinta-600">
            Agrega tu ubicación y te mostramos qué tan cerca te queda cada vacante.
          </p>
          <Link
            to="/mi-perfil"
            className="shrink-0 self-start rounded-lg bg-meyah-jade-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-meyah-jade-700 transition-colors sm:self-auto"
          >
            Agregar mi ubicación
          </Link>
        </div>
      )}

      {/* Estados de carga / error / vacío / datos */}
      {isPending ? (
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-meyah-tinta-600/10 bg-meyah-crema-100 p-5 h-28"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-6 text-sm text-meyah-terracota-700">
          No pudimos cargar las vacantes. Intenta de nuevo más tarde.
        </p>
      ) : !data || data.length === 0 ? (
        <p className="mt-6 text-sm text-meyah-tinta-600">
          Aún no hay vacantes publicadas. Vuelve pronto.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {data.map(job => (
            <NearbyJobCard key={job.id} job={job} />
          ))}
        </div>
      )}

    </div>
  )
}
