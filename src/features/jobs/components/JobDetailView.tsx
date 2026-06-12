import { useEffect } from 'react'
import { Building2, Loader2, MapPin, Share2, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useJobDetail } from '@/features/jobs/hooks/useJobDetail'
import { useMyApplicationForJob } from '@/features/applications/hooks/useMyApplicationForJob'
import { useCreateApplication } from '@/features/applications/hooks/useCreateApplication'
import ApplyForm from '@/features/applications/components/ApplyForm'
import { APPLICATION_STATUS_LABEL } from '@/features/applications/constants'
import type { ApplicationSchemaOutput } from '@/features/applications/schemas/application.schema'
import { ICON_BY_CATEGORY, JOB_CATEGORIES } from '@/features/jobs/schemas/categories'
import type { JobCategoryValue } from '@/features/jobs/schemas/categories'
import { formatDistance } from '@/shared/lib/formatDistance'
import { formatSalary } from '@/shared/lib/formatSalary'
import { supabase } from '@/shared/lib/supabase'

interface JobDetailViewProps {
  jobId: string
  distanciaM?: number | null
}

// Vacantes ya contadas en esta sesión — evita inflar views_count por
// re-aperturas del panel y por el doble-montaje de StrictMode.
const viewedJobs = new Set<string>()

export default function JobDetailView({ jobId, distanciaM }: JobDetailViewProps) {
  const { profile } = useAuth()
  const { data: job, isLoading, isError } = useJobDetail(jobId)
  const { data: application } = useMyApplicationForJob(jobId)
  const createApplication = useCreateApplication()

  useEffect(() => {
    if (!jobId || profile?.tipo !== 'candidato') return
    if (viewedJobs.has(jobId)) return
    viewedJobs.add(jobId)
    void supabase.rpc('increment_job_views', { p_job_id: jobId })
  }, [jobId, profile?.tipo])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error de red ≠ vacante inexistente: antes ambos caían en "no encontrada"
  if (isError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">
          No se pudo cargar la vacante. Intenta de nuevo más tarde.
        </p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">Esta vacante ya no está disponible.</p>
      </div>
    )
  }

  const labelCategoria = JOB_CATEGORIES.find(c => c.value === job.categoria)?.label ?? job.categoria
  const Icon = ICON_BY_CATEGORY[job.categoria as JobCategoryValue] ?? ICON_BY_CATEGORY.otro
  const dist = formatDistance(distanciaM ?? null)

  const recibePostulaciones =
    job.estado === 'abierta' &&
    job.expires_at != null &&
    new Date(job.expires_at) > new Date()

  // Compartir: share sheet nativo en móvil (~75% del uso real), copiar enlace
  // en desktop. La ruta /vacante/:id ya existe; quien abra el link sin sesión
  // pasa por login y vuelve protegido por los guards.
  const shareJob = async () => {
    const url = `${window.location.origin}/vacante/${job.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: job.titulo, text: `${job.titulo} — ${job.company?.nombre ?? 'Meyah'}`, url })
      } catch {
        // El usuario canceló el share sheet: no es un error
      }
      return
    }
    await navigator.clipboard.writeText(url)
    toast.success('Enlace copiado')
  }

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
    <div>
      {/* Cabecera */}
      <div className="greca border-b border-meyah-border-soft bg-meyah-jade-50 px-7.5 pt-8.5 pb-6.5">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-[16px] bg-white text-meyah-jade-700 shadow-sm">
          <Icon size={26} />
        </div>
        <span className="inline-flex items-center rounded-full bg-meyah-jade-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
          {labelCategoria}
        </span>
        <button
          type="button"
          onClick={() => void shareJob()}
          className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-meyah-jade-700 shadow-xs transition hover:bg-meyah-jade-50"
        >
          <Share2 size={12} /> Compartir
        </button>
        <h2 className="mt-2 text-[28px]">{job.titulo}</h2>
        <p className="mt-2.5 flex items-center gap-1.5 text-[14px] text-meyah-tinta-600">
          <Building2 size={15} />{job.company?.nombre ?? 'Empresa no disponible'}
        </p>
      </div>

      {/* Cuerpo */}
      <div className="px-7.5 py-6">
        <div className="mb-5.5 grid grid-cols-3 gap-2.5 max-[520px]:grid-cols-1">
          <div className="flex flex-col gap-2 rounded-field border border-meyah-border-soft bg-white p-3.5">
            <Wallet size={18} className="text-meyah-jade-600" />
            <b className="block text-[14px] text-meyah-tinta-900">{formatSalary(job.salario_min, job.salario_max)}</b>
            <span className="text-[11.5px] text-meyah-tinta-400">al mes</span>
          </div>
          {dist && (
            <div className="flex flex-col gap-2 rounded-field border border-meyah-border-soft bg-white p-3.5">
              <MapPin size={18} className="text-meyah-jade-600" />
              <b className="block text-[14px] text-meyah-tinta-900">{dist}</b>
              <span className="text-[11.5px] text-meyah-tinta-400">de tu ubicación</span>
            </div>
          )}
        </div>
        <p className="whitespace-pre-line text-[14.5px] leading-[1.65] text-meyah-tinta-600">{job.descripcion}</p>
      </div>

      {/* Footer de acción — solo candidatos */}
      {profile?.tipo === 'candidato' && (
        <div className="flex gap-2.5 border-t border-meyah-border-soft bg-meyah-crema-50 px-7.5 py-4.5">
          {application ? (
            <div className="flex-1 rounded-field border border-meyah-jade-500/20 bg-meyah-jade-50 p-3.5">
              <p className="text-[13px] font-semibold text-meyah-jade-700">Ya te postulaste</p>
              <p className="mt-0.5 text-[12px] text-meyah-tinta-600">
                Estado: <span className="font-semibold">{APPLICATION_STATUS_LABEL[application.estado]}</span>
              </p>
            </div>
          ) : recibePostulaciones ? (
            <div className="flex-1">
              <ApplyForm onSubmit={onSubmit} isSubmitting={createApplication.isPending} />
            </div>
          ) : (
            <p className="text-[13.5px] text-meyah-tinta-600">Esta vacante ya no recibe postulaciones.</p>
          )}
        </div>
      )}
    </div>
  )
}
