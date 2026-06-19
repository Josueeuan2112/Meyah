import { useEffect, useState } from 'react'
import { Building2, ChevronRight, Clock, Loader2, MapPin, MessageCircle, Share2, Wallet } from 'lucide-react'

import { toast } from 'sonner'
import { useLocation, useNavigate } from 'react-router'

import Avatar from '@/shared/components/Avatar'
import VerifiedBadge from '@/features/companies/components/VerifiedBadge'
import { COMPANY_LOGOS_BUCKET } from '@/features/companies/hooks/useUploadCompanyLogo'
import { CompanyRatingBadge } from '@/features/reviews/components/CompanyRatingBadge'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useJobDetail } from '@/features/jobs/hooks/useJobDetail'
import { useMyApplicationForJob } from '@/features/applications/hooks/useMyApplicationForJob'
import { useCreateApplication } from '@/features/applications/hooks/useCreateApplication'
import ApplyForm from '@/features/applications/components/ApplyForm'
import { APPLICATION_STATUS_LABEL } from '@/features/applications/constants'
import type { ApplicationSchemaOutput } from '@/features/applications/schemas/application.schema'
import { ICON_BY_CATEGORY, JOB_CATEGORIES, JOB_SCHEDULES } from '@/features/jobs/schemas/categories'
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
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: job, isLoading, isError } = useJobDetail(jobId)
  const { data: application } = useMyApplicationForJob(jobId)
  const createApplication = useCreateApplication()
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    if (!jobId || profile?.tipo !== 'candidato') return
    if (viewedJobs.has(jobId)) return
    viewedJobs.add(jobId)
    void supabase.rpc('record_job_view', { p_job_id: jobId })
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
  const labelJornada = JOB_SCHEDULES.find(s => s.value === job.jornada)?.label ?? job.jornada
  const Icon = ICON_BY_CATEGORY[job.categoria as JobCategoryValue] ?? ICON_BY_CATEGORY.otro
  const dist = formatDistance(distanciaM ?? null)

  const recibePostulaciones =
    job.estado === 'abierta' &&
    job.expires_at != null &&
    new Date(job.expires_at) > new Date()

  // La ruta /vacante/:id es pública: el link abre sin sesión (SEO + compartir).
  const shareUrl = `${window.location.origin}/vacante/${job.id}`
  const shareText = `${job.titulo} — ${job.company?.nombre ?? 'Meyah'}`

  // Share sheet nativo (~75% del uso real es móvil). Si no existe, copia enlace.
  const shareNative = async () => {
    setShareOpen(false)
    if (navigator.share) {
      try {
        await navigator.share({ title: job.titulo, text: shareText, url: shareUrl })
      } catch {
        // El usuario canceló el share sheet: no es un error
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Enlace copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  // WhatsApp es el canal #1 en Mérida: opción explícita, no solo el share genérico.
  const shareWhatsApp = () => {
    setShareOpen(false)
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  // Sin sesión: el botón de postularse manda a login y vuelve a esta vacante.
  const goToLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
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
        <span className="relative ml-2 inline-block">
          <button
            type="button"
            onClick={() => setShareOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={shareOpen}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-meyah-jade-700 shadow-xs transition hover:bg-meyah-jade-50"
          >
            <Share2 size={12} /> Compartir
          </button>
          {shareOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} />
              <div
                role="menu"
                className="absolute left-0 top-9 z-20 w-52 rounded-2xl border border-meyah-border-soft bg-white p-1.5 shadow-lg"
                style={{ animation: 'rise .18s ease' }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={shareWhatsApp}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.75 text-left text-[13.5px] font-medium text-meyah-tinta-900 hover:bg-meyah-jade-50"
                >
                  <MessageCircle size={16} className="text-meyah-jade-700" /> Compartir por WhatsApp
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void shareNative()}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.75 text-left text-[13.5px] font-medium text-meyah-tinta-900 hover:bg-meyah-jade-50"
                >
                  <Share2 size={16} className="text-meyah-jade-700" /> Más opciones
                </button>
              </div>
            </>
          )}
        </span>
        <h2 className="mt-2 text-[28px]">{job.titulo}</h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-meyah-tinta-600">
          {job.company ? (
            <Avatar
              path={job.company.logo_path}
              legacyUrl={job.company.logo_url}
              bucket={COMPANY_LOGOS_BUCKET}
              name={job.company.nombre}
              tone="terracota"
              shape="rounded"
              size={28}
              updatedAt={job.company.updated_at}
              className="rounded-lg"
            />
          ) : (
            <Building2 size={15} className="flex-none" />
          )}
          {job.company_id ? (
            <button
              type="button"
              onClick={() => navigate(`/empresas/${job.company_id}`)}
              className="group inline-flex items-center gap-1 font-semibold text-meyah-jade-700 transition-colors hover:text-meyah-jade-900"
            >
              <span className="border-b border-meyah-jade-700/40 pb-px group-hover:border-meyah-jade-900">
                {job.company?.nombre ?? 'Empresa'}
              </span>
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <span>{job.company?.nombre ?? 'Empresa no disponible'}</span>
          )}
          <VerifiedBadge verified={job.company?.is_verified ?? false} />
          {job.company_id && <CompanyRatingBadge companyId={job.company_id} />}
        </div>
        {job.company_id && (
          <p className="mt-1 text-[12px] text-meyah-tinta-400">Toca el nombre para ver el perfil de la empresa</p>
        )}
      </div>

      {/* Cuerpo */}
      <div className="px-7.5 py-6">
        <div className="mb-5.5 grid grid-cols-3 gap-2.5 max-[520px]:grid-cols-1">
          <div className="flex flex-col gap-2 rounded-field border border-meyah-border-soft bg-white p-3.5">
            <Wallet size={18} className="text-meyah-jade-600" />
            <b className="block text-[14px] text-meyah-tinta-900">{formatSalary(job.salario_min, job.salario_max)}</b>
            <span className="text-[11.5px] text-meyah-tinta-400">al mes</span>
          </div>
          <div className="flex flex-col gap-2 rounded-field border border-meyah-border-soft bg-white p-3.5">
            <Clock size={18} className="text-meyah-jade-600" />
            <b className="block text-[14px] text-meyah-tinta-900">{labelJornada}</b>
            <span className="text-[11.5px] text-meyah-tinta-400">jornada</span>
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

      {/* Footer de acción — visitante sin sesión: CTA a login con retorno */}
      {!session && recibePostulaciones && (
        <div className="border-t border-meyah-border-soft bg-meyah-crema-50 px-7.5 py-4.5">
          <button
            type="button"
            onClick={goToLogin}
            className="w-full rounded-field bg-meyah-jade-900 px-5 py-3.25 text-center text-[14px] font-semibold text-white transition hover:bg-meyah-jade-700"
          >
            Inicia sesión para postularte
          </button>
          <p className="mt-2 text-center text-[12.5px] text-meyah-tinta-400">
            ¿Aún no tienes cuenta? La creas gratis en un minuto.
          </p>
        </div>
      )}

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
