import { Link } from 'react-router'
import { Clock, ListChecks, Loader2, MapPin, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'

import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import { useMyJobs } from '@/features/jobs/hooks/useMyJobs'
import type { MyJob } from '@/features/jobs/hooks/useMyJobs'
import { useMyJobsProximity } from '@/features/jobs/hooks/useMyJobsProximity'
import { useUpdateJob } from '@/features/jobs/hooks/useUpdateJob'
import { useDeleteJob } from '@/features/jobs/hooks/useDeleteJob'
import AnalyticsPanel from '@/features/jobs/components/AnalyticsPanel'
import { ICON_BY_CATEGORY, JOB_CATEGORIES } from '@/features/jobs/schemas/categories'
import type { JobCategoryValue } from '@/features/jobs/schemas/categories'
import { formatSalary } from '@/shared/lib/formatSalary'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const fechaFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

// Nueva vigencia al reabrir una vacante vencida: 30 días desde ahora (mismo
// plazo que el default de creación). A nivel de módulo para que el linter de
// purity del React Compiler no marque Date.now() dentro del componente.
function renovarVigencia(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

export default function DashboardPage() {
  // Todos los hooks antes de cualquier return condicional (reglas de hooks)
  const { data: company, isLoading: companyLoading, isError: companyError } = useMyCompany()
  const { data: jobs, isLoading: jobsLoading, isError: jobsError } = useMyJobs()
  const { data: proximity } = useMyJobsProximity()
  const updateJob = useUpdateJob()
  const deleteJob = useDeleteJob()

  const handleToggleEstado = (job: MyJob) => {
    const estado: 'abierta' | 'cerrada' = job.estado === 'abierta' ? 'cerrada' : 'abierta'

    // Reabrir una vacante vencida sin extender expires_at era un estado
    // inconsistente: el toast decía "reabierta" pero el feed (expires_at >
    // now()) jamás la mostraba ni aceptaba postulaciones. Al reabrir vencida,
    // se renueva la vigencia 30 días (mismo plazo que el default de creación).
    const vencida = job.expires_at != null && new Date(job.expires_at) < new Date()
    const data =
      estado === 'abierta' && vencida
        ? { estado, expires_at: renovarVigencia() }
        : { estado }

    updateJob.mutate(
      { id: job.id, data },
      {
        onSuccess: () => toast.success(estado === 'cerrada' ? 'Vacante cerrada' : 'Vacante reabierta'),
        onError:   () => toast.error('No se pudo actualizar la vacante'),
      }
    )
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Eliminar esta vacante? Esta acción ocultará la vacante y sus postulaciones.')) return
    deleteJob.mutate(id, {
      onSuccess: () => toast.success('Vacante eliminada'),
      onError:   () => toast.error('No se pudo eliminar la vacante'),
    })
  }

  //  Estado 1: empresa cargando
  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  //  Estado 2: error de empresa
  if (companyError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-muted-foreground">
          No se pudo cargar tu información. Intenta de nuevo.
        </p>
      </div>
    )
  }

  //  Estado 3: sin empresa
  // useMyJobs está desactivado sin companyId; evaluar este estado antes de los de jobs
  if (!company) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Primero crea tu empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Necesitas registrar tu empresa antes de publicar vacantes.
            </p>
            <Button asChild>
              <Link to="/mi-empresa">Crear empresa</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  //  Estado 4: empresa lista, vacantes cargando
  if (jobsLoading) {
    return (
      <div className="mx-auto w-full max-w-295 px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Tu panel</span>
            <h1 className="mt-1 text-[clamp(28px,4vw,36px)]">Mis vacantes</h1>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 flex-none rounded-[14px] bg-meyah-crema-100" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 w-1/2 rounded-full bg-meyah-crema-100" />
                  <div className="h-3 w-1/3 rounded-full bg-meyah-crema-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  //  Estado 5: error de jobs
  if (jobsError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-muted-foreground">
          No se pudieron cargar tus vacantes. Intenta de nuevo.
        </p>
      </div>
    )
  }

  //  Estado 6: resuelto
  const jobList = jobs ?? []
  const activas = jobList.filter(j => j.estado === 'abierta').length
  const postulantes = jobList.reduce((sum, j) => sum + (j.applications?.[0]?.count ?? 0), 0)
  const cercanosMap = new Map((proximity ?? []).map(p => [p.job_id, p.cercanos]))
  const totalCercanos = jobList.reduce((sum, j) => sum + (cercanosMap.get(j.id) ?? 0), 0)

  return (
    <div className="mx-auto w-full max-w-295 px-4 py-8 sm:px-6">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>

        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Tu panel</span>
            <h1 className="mt-1 text-[clamp(28px,4vw,36px)]">Mis vacantes</h1>
          </div>
          <Button asChild>
            <Link to="/dashboard/nueva-vacante">Publicar vacante <Plus size={18} /></Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700">
              <ListChecks size={22} />
            </div>
            <div>
              <p className="font-display text-[34px] font-semibold leading-none text-meyah-jade-900">{activas}</p>
              <p className="mt-1 text-[14px] text-meyah-tinta-600">vacantes activas</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700">
              <Users size={22} />
            </div>
            <div>
              <p className="font-display text-[34px] font-semibold leading-none text-meyah-jade-900">{postulantes}</p>
              <p className="mt-1 text-[14px] text-meyah-tinta-600">postulantes</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-panel border border-meyah-border-soft bg-meyah-jade-900 p-6 shadow-sm">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-[14px] bg-white/10 text-white">
              <MapPin size={22} />
            </div>
            <div>
              <p className="font-display text-[34px] font-semibold leading-none text-white">{totalCercanos}</p>
              <p className="mt-1 text-[14px] text-white/70">a menos de 3 km</p>
            </div>
          </div>
        </div>

        {/* Lista de vacantes */}
        {jobList.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-panel border border-meyah-border-soft bg-white px-6 py-16 text-center">
            <div className="grid h-15 w-15 place-items-center rounded-panel bg-meyah-crema-100 text-meyah-tinta-400">
              <ListChecks size={26} />
            </div>
            <h3 className="text-[20px]">Aún no has publicado vacantes</h3>
            <Button asChild>
              <Link to="/dashboard/nueva-vacante">Publicar tu primera vacante</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobList.map((job, i) => {
              const Icon = ICON_BY_CATEGORY[job.categoria as JobCategoryValue] ?? ICON_BY_CATEGORY.otro
              const label = JOB_CATEGORIES.find(c => c.value === job.categoria)?.label ?? job.categoria
              const abierta = job.estado === 'abierta'
              const count = job.applications?.[0]?.count ?? 0
              const vencida = job.estado === 'abierta' && job.expires_at != null && new Date(job.expires_at) < new Date()
              // Aviso temprano: días restantes de vigencia (solo abiertas no vencidas,
              // visible a partir de 7 días) — evita el funnel muerto de vacantes vencidas
              const diasRestantes =
                abierta && !vencida && job.expires_at != null
                  ? Math.ceil((new Date(job.expires_at).getTime() - new Date().getTime()) / 86400000)
                  : null
              const porVencer = diasRestantes != null && diasRestantes <= 7

              return (
                <article
                  key={job.id}
                  className="rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm"
                  style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards', animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="grid h-12 w-12 flex-none place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700">
                        <Icon size={22} />
                      </div>
                      <div>
                        <h3 className="font-display text-[22px] text-meyah-jade-900">{job.titulo}</h3>
                        <p className="mt-0.5 text-[14px] text-meyah-tinta-600">{label}</p>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      {vencida && (
                        <span className="rounded-full bg-meyah-terracota-50 px-3.25 py-1.5 text-[13px] font-semibold text-meyah-terracota-700">
                          Vencida
                        </span>
                      )}
                      {porVencer && (
                        <span className="rounded-full bg-meyah-terracota-50 px-3.25 py-1.5 text-[13px] font-semibold text-meyah-terracota-700">
                          Vence en {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3.25 py-1.5 text-[13px] font-semibold ${
                          abierta ? 'bg-meyah-jade-50 text-meyah-jade-700' : 'bg-meyah-crema-100 text-meyah-tinta-500'
                        }`}
                      >
                        {abierta ? 'Abierta' : 'Cerrada'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-x-12 gap-y-3 border-t border-meyah-border-soft pt-4">
                    <div>
                      <p className="text-[18px] font-bold text-meyah-jade-900">{formatSalary(job.salario_min, job.salario_max)}</p>
                      <p className="text-[12.5px] text-meyah-tinta-400">sueldo / mes</p>
                    </div>
                    <Link to={`/dashboard/vacante/${job.id}/postulantes`} className="rounded-field transition hover:opacity-70">
                      <p className="text-[18px] font-bold text-meyah-tinta-900">{count}</p>
                      <p className="text-[12.5px] text-meyah-tinta-400">postulantes</p>
                    </Link>
                    <div>
                      <p className="text-[18px] font-bold text-meyah-tinta-900">{cercanosMap.get(job.id) ?? 0}</p>
                      <p className="text-[12.5px] text-meyah-tinta-400">cercanos</p>
                    </div>
                    <div>
                      <p className="text-[18px] font-bold text-meyah-tinta-900">{job.views_count ?? 0}</p>
                      <p className="text-[12.5px] text-meyah-tinta-400">vistas</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-meyah-border-soft pt-4">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-meyah-tinta-400">
                      <Clock size={13} /> Publicada el {fechaFmt.format(new Date(job.created_at))}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/vacante/${job.id}/editar`}>Editar</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updateJob.isPending && updateJob.variables?.id === job.id}
                        onClick={() => handleToggleEstado(job)}
                      >
                        {abierta ? 'Cerrar' : 'Reabrir'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteJob.isPending && deleteJob.variables === job.id}
                        onClick={() => handleDelete(job.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Analytics — solo si hay al menos una vacante */}
        {jobList.length > 0 && <AnalyticsPanel />}

      </div>
    </div>
  )
}
