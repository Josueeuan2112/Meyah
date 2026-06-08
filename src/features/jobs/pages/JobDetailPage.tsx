import { useParams } from 'react-router'
import { ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useJobDetail } from '@/features/jobs/hooks/useJobDetail'
import { useMyApplicationForJob } from '@/features/applications/hooks/useMyApplicationForJob'
import { useCreateApplication } from '@/features/applications/hooks/useCreateApplication'
import ApplyForm from '@/features/applications/components/ApplyForm'
import { getCategoryLabel } from '@/features/jobs/schemas/categories'
import type { ApplicationSchemaOutput } from '@/features/applications/schemas/application.schema'
import { APPLICATION_STATUS_LABEL } from '@/features/applications/constants'

function formatSalary(min: number | null, max: number | null): string | null {
  if (min != null && max != null)
    return `$${min.toLocaleString('es-MX')} – $${max.toLocaleString('es-MX')}`
  if (min != null) return `Desde $${min.toLocaleString('es-MX')}`
  if (max != null) return `Hasta $${max.toLocaleString('es-MX')}`
  return null
}

export default function JobDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { data: job, isLoading } = useJobDetail(id)
  const { data: application } = useMyApplicationForJob(id)
  const createApplication = useCreateApplication()

  // Estado: cargando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Estado: no encontrada (null = maybeSingle sin fila; undefined = disabled/error)
  if (!job) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">Vacante no encontrada.</p>
      </div>
    )
  }

  const salary = formatSalary(job.salario_min, job.salario_max)

  const recibePostulaciones =
    job.estado === 'abierta' &&
    job.expires_at != null &&
    new Date(job.expires_at) > new Date()

  const onSubmit = (values: ApplicationSchemaOutput) => {
    createApplication.mutate(
      { jobId: job.id, mensaje: values.mensaje },
      {
        onSuccess: () => toast.success('Postulación enviada'),
        onError: (e) => toast.error(e.message),
      }
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">

      {/* Kicker + título + empresa */}
      <div className="mb-6">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-meyah-terracota-700">
          {getCategoryLabel(job.categoria)}
        </span>
        <h1 className="font-display text-3xl md:text-4xl text-meyah-jade-900 mt-3 leading-tight">
          {job.titulo}
        </h1>
        <p className="text-base text-meyah-tinta-600 mt-2">
          {job.company?.nombre ?? 'Empresa no disponible'}
        </p>
      </div>

      {/* Salario */}
      {salary && (
        <p className="text-lg font-semibold text-meyah-jade-700 mb-6">{salary}</p>
      )}

      {/* Descripción */}
      <p className="text-meyah-tinta-600 whitespace-pre-line leading-relaxed mb-8">
        {job.descripcion}
      </p>

      {/* Empresa */}
      {job.company && (
        <div className="bg-meyah-crema-100 border border-meyah-tinta-600/10 rounded-xl p-5 mb-8 space-y-3">
          <div className="flex items-center gap-3">
            {job.company.logo_url && (
              <img
                src={job.company.logo_url}
                alt={job.company.nombre}
                className="h-10 w-10 rounded-lg object-contain bg-white"
              />
            )}
            <p className="font-semibold text-meyah-tinta-900">{job.company.nombre}</p>
          </div>
          {job.company.descripcion && (
            <p className="text-sm text-meyah-tinta-600">{job.company.descripcion}</p>
          )}
          {job.company.sitio_web && (
            <a
              href={job.company.sitio_web}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-meyah-jade-700 hover:underline"
            >
              Visitar sitio web
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          )}
        </div>
      )}

      {/* Sección de postulación — solo candidatos */}
      {profile?.tipo === 'candidato' && (
        <div className="border-t border-meyah-tinta-600/10 pt-8">
          <h2 className="text-xl font-semibold text-meyah-tinta-900 mb-4">Postulación</h2>

          {application ? (
            <div className="bg-meyah-jade-50 border border-meyah-jade-500/20 rounded-xl p-5">
              <p className="text-sm font-medium text-meyah-jade-700">Ya te postulaste</p>
              <p className="text-xs text-meyah-tinta-600 mt-1">
                Estado:{' '}
                <span className="font-semibold">{APPLICATION_STATUS_LABEL[application.estado]}</span>
              </p>
            </div>
          ) : recibePostulaciones ? (
            <ApplyForm onSubmit={onSubmit} isSubmitting={createApplication.isPending} />
          ) : (
            <p className="text-sm text-meyah-tinta-600">
              Esta vacante ya no recibe postulaciones.
            </p>
          )}
        </div>
      )}

    </div>
  )
}
