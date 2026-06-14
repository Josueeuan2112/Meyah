import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useState } from 'react'
import { ArrowLeft, FileText, MapPin, MessageSquare, Phone, Users } from 'lucide-react'
import { toast } from 'sonner'

import { useJobDetail } from '@/features/jobs/hooks/useJobDetail'
import { useJobApplicants } from '@/features/applications/hooks/useJobApplicants'
import { useUpdateApplicationStatus } from '@/features/applications/hooks/useUpdateApplicationStatus'
import { useMarkApplicationsViewed } from '@/features/applications/hooks/useMarkApplicationsViewed'
import { useCreateConversation } from '@/features/chat/hooks/useCreateConversation'
import { getSignedCVUrl } from '@/features/profile/hooks/useCV'
import { APPLICATION_STATUS_BADGE_CLASS, APPLICATION_STATUS_LABEL } from '@/features/applications/constants'
import { formatDistance } from '@/shared/lib/formatDistance'
import { Button } from '@/shared/ui/button'

const fechaFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

function getIniciales(nombre: string): string {
  const trimmed = nombre.trim()
  return trimmed
    ? trimmed.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?'
}

export default function JobApplicantsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loadingCvId, setLoadingCvId] = useState<string | null>(null)

  const handleViewCV = async (cvPath: string, appId: string) => {
    setLoadingCvId(appId)
    const url = await getSignedCVUrl(cvPath)
    setLoadingCvId(null)
    if (url) window.open(url, '_blank')
  }

  const { data: job, isLoading: jobLoading } = useJobDetail(id)
  const { data: applicants, isLoading: applicantsLoading, isError } = useJobApplicants(id)
  const updateStatus = useUpdateApplicationStatus(id ?? '')
  const markViewed = useMarkApplicationsViewed(id)
  const createConversation = useCreateConversation()

  // Al abrir la lista, las 'pendiente' pasan a 'vista' (una vez por montaje):
  // el candidato ve en sus postulaciones que el empleador ya las abrió
  const markedRef = useRef(false)
  const markViewedMutate = markViewed.mutate
  useEffect(() => {
    if (markedRef.current) return
    if (!applicants?.some(a => a.estado === 'pendiente')) return
    markedRef.current = true
    markViewedMutate()
  }, [applicants, markViewedMutate])

  const handleAceptar = (appId: string) => {
    updateStatus.mutate(
      { id: appId, estado: 'aceptada' },
      {
        onSuccess: () => toast.success('Postulante aceptado'),
        onError:   () => toast.error('No se pudo actualizar la postulación'),
      }
    )
  }

  const handleChat = (candidatoId: string) => {
    if (!id) return
    createConversation.mutate(
      { jobId: id, candidatoId },
      {
        onSuccess: (conversationId) => void navigate(`/mensajes/${conversationId}`),
        onError: () => toast.error('No se pudo iniciar el chat'),
      },
    )
  }

  const handleRechazar = (appId: string) => {
    updateStatus.mutate(
      { id: appId, estado: 'rechazada' },
      {
        onSuccess: () => toast.success('Postulante rechazado'),
        onError:   () => toast.error('No se pudo actualizar la postulación'),
      }
    )
  }

  if (jobLoading || applicantsLoading) {
    return (
      <div className="mx-auto w-full max-w-230 px-4 py-8 sm:px-6">
        <div className="mb-4 h-5 w-16 animate-pulse rounded-full bg-meyah-crema-100" />
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-meyah-crema-100" />
        <div className="mt-7 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-panel border border-meyah-border-soft bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 flex-none rounded-full bg-meyah-crema-100" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 w-1/3 rounded-full bg-meyah-crema-100" />
                  <div className="h-3 w-1/4 rounded-full bg-meyah-crema-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">Vacante no encontrada.</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">
          No se pudieron cargar los postulantes. Intenta de nuevo.
        </p>
      </div>
    )
  }

  const apps = applicants ?? []
  // "Sin responder" = pendiente o vista (la vista automática al abrir esta
  // página volvería el contador de 'pendiente' siempre 0 y perdería sentido)
  const sinResponder = apps.filter(a => a.estado === 'pendiente' || a.estado === 'vista').length

  return (
    <div className="mx-auto w-full max-w-230 px-4 py-8 sm:px-6">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>

        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-[14px] text-meyah-tinta-600 hover:text-meyah-jade-900"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <span className="eyebrow">Postulantes</span>
        <h1 className="mt-1 text-[clamp(26px,4vw,34px)]">{job.titulo}</h1>
        <p className="mt-2 text-[14.5px] text-meyah-tinta-600">
          {apps.length} postulantes · {sinResponder} sin responder · del más cercano
        </p>

        {/* Lista */}
        {apps.length === 0 ? (
          <div className="mt-7 flex flex-col items-center gap-3 rounded-panel border border-meyah-border-soft bg-white px-6 py-16 text-center">
            <div className="grid h-15 w-15 place-items-center rounded-panel bg-meyah-crema-100 text-meyah-tinta-400">
              <Users size={26} />
            </div>
            <h3 className="text-[20px]">Aún no hay postulantes</h3>
            <p className="max-w-70 text-[13.5px] text-meyah-tinta-600">
              Cuando alguien se postule a esta vacante lo verás aquí, ordenado por cercanía.
            </p>
          </div>
        ) : (
          <div className="mt-7 flex flex-col gap-4">
            {apps.map((app, i) => {
              const nombre = app.candidato_nombre ?? 'Candidato'
              const dist = formatDistance(app.distancia_m)
              const isUpdating = updateStatus.isPending && updateStatus.variables?.id === app.id

              return (
                <article
                  key={app.id}
                  className="rounded-panel border border-meyah-border-soft bg-white p-5 shadow-sm"
                  style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards', animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-meyah-jade-500 font-display text-[18px] font-semibold text-white">
                        {getIniciales(nombre)}
                      </div>
                      <div>
                        <h3 className="text-[18px] font-semibold text-meyah-jade-900">{nombre}</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[12.5px] text-meyah-tinta-400">Postulado el {fechaFmt.format(new Date(app.created_at))}</span>
                          {dist ? (
                            <span className="inline-flex items-center gap-0.75 rounded-full bg-meyah-jade-50 px-2 py-0.5 text-[12px] font-semibold text-meyah-jade-700">
                              <MapPin size={12} /> {dist}
                            </span>
                          ) : (
                            <span className="text-[12px] text-meyah-tinta-400">· Sin ubicación</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`flex-none whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${APPLICATION_STATUS_BADGE_CLASS[app.estado]}`}>
                      {APPLICATION_STATUS_LABEL[app.estado]}
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2 text-[14px]">
                    {app.candidato_phone ? (
                      <a href={`tel:${app.candidato_phone}`} className="inline-flex items-center gap-1.5 font-medium text-meyah-jade-700 hover:underline">
                        <Phone size={14} /> {app.candidato_phone}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-meyah-tinta-400">
                        <Phone size={14} /> Sin teléfono registrado
                      </span>
                    )}
                  </div>

                  {app.mensaje && (
                    <p className="mt-3 border-l-2 border-meyah-border pl-3 text-[14px] italic leading-[1.6] text-meyah-tinta-600">
                      {app.mensaje}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2.5 border-t border-meyah-border-soft pt-4">
                    <Button size="sm" onClick={() => handleAceptar(app.id)} disabled={app.estado === 'aceptada' || isUpdating}>
                      Aceptar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRechazar(app.id)} disabled={app.estado === 'rechazada' || isUpdating}>
                      Rechazar
                    </Button>
                    {app.cv_path && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCV(app.cv_path!, app.id)}
                        disabled={loadingCvId === app.id}
                      >
                        <FileText size={14} className="mr-1.5" />
                        {loadingCvId === app.id ? 'Cargando…' : 'Ver CV'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChat(app.candidato_id)}
                      disabled={createConversation.isPending}
                      className="ml-auto"
                    >
                      <MessageSquare size={14} className="mr-1.5" /> Chat
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
