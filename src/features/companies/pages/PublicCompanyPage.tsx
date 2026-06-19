import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeft, Bookmark, Briefcase, CalendarDays, Check, ChevronRight, Clock,
  FileText, Globe, Loader2, Mail, MapPin, MessageSquare, MoreHorizontal,
  Phone, Share2, ShieldCheck, UserPlus, Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { usePublicCompany } from '@/features/companies/hooks/usePublicCompany'
import { useCompanyJobs } from '@/features/companies/hooks/useCompanyJobs'
import {
  useFollowersCount, useFollowState, useSaveState, useStartCompanyConversation,
} from '@/features/companies/hooks/useCompanySocial'
import ReportCompanyDialog from '@/features/companies/components/ReportCompanyDialog'
import CompanyProfileHero from '@/features/companies/components/CompanyProfileHero'
import {
  SOCIAL_FIELDS, companySizeLabel, memberSinceYear,
} from '@/features/companies/schemas/companyMeta'
import { getCategoryLabel } from '@/features/jobs/schemas/categories'
import { formatSalary } from '@/shared/lib/formatSalary'
import { cn } from '@/shared/lib/utils'

const fmtDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * Devuelve la URL solo si es http(s); de lo contrario undefined. Evita que un
 * valor controlado por el empleador (sitio_web) con esquema `javascript:`/`data:`
 * se renderice en un <a href> y ejecute código en la sesión del candidato.
 */
function safeHttpUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : undefined
  } catch {
    return undefined
  }
}

export default function PublicCompanyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const { data: company, isLoading, isError } = usePublicCompany(id)
  const { data: jobs } = useCompanyJobs(id)
  const { data: followers } = useFollowersCount(id)
  const follow = useFollowState(id)
  const save = useSaveState(id)
  const startConversation = useStartCompanyConversation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [reporting, setReporting] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-meyah-jade-500" />
      </div>
    )
  }

  if (isError || !company) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <p className="text-meyah-tinta-600">No se pudo cargar el perfil de la empresa.</p>
        <button onClick={() => navigate(-1)} className="text-[14px] font-semibold text-meyah-jade-700 hover:underline">
          Volver
        </button>
      </div>
    )
  }

  const isCandidate = profile?.tipo === 'candidato'
  const isOwner = !!user && company.owner_id === user.id
  const canInteract = isCandidate && !isOwner

  const sizeLabel = companySizeLabel(company.tamano)
  const year = memberSinceYear(company.created_at)
  const socials = SOCIAL_FIELDS
    .map(s => ({ ...s, value: company[s.key] }))
    .filter((s): s is typeof s & { value: string } => !!s.value)

  const goBack = () => navigate(-1)

  const handleShare = async () => {
    setMenuOpen(false)
    const url = `${window.location.origin}/empresas/${company.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: company.nombre, text: `Conoce ${company.nombre} en Meyah`, url })
      } catch { /* el usuario canceló */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace del perfil copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const handleMessage = () => {
    if (!canInteract) return
    startConversation.mutate(
      { id: company.id, owner_id: company.owner_id },
      {
        onSuccess: convId => navigate(`/mensajes/${convId}`),
        onError: () => toast.error('No se pudo iniciar la conversación.'),
      },
    )
  }

  const handleFollow = () => {
    if (!canInteract) return
    const next = !follow.isFollowing
    follow.toggle(next)
    toast.success(next ? `Ahora sigues a ${company.nombre}` : 'Dejaste de seguir')
  }

  const handleSave = () => {
    if (!canInteract) return
    const next = !save.isSaved
    save.toggle(next)
    toast.success(next ? 'Guardada en favoritos' : 'Quitada de favoritos')
  }

  // Secciones del cuerpo (solo se renderizan si hay datos)
  const hasMisionVision = !!company.mision || !!company.vision
  const hasCultura = company.valores.length > 0 || company.beneficios.length > 0

  interface QuickRow { icon: ReactNode; label: string; value: string; href?: string }
  const quickRowsRaw: (QuickRow | null)[] = [
    company.categoria ? { icon: <Briefcase size={16} />, label: 'Sector', value: company.categoria } : null,
    company.razon_social ? { icon: <FileText size={16} />, label: 'Razón social', value: company.razon_social } : null,
    sizeLabel ? { icon: <Users size={16} />, label: 'Tamaño', value: sizeLabel } : null,
    { icon: <MapPin size={16} />, label: 'Ubicación', value: company.direccion },
    year ? { icon: <CalendarDays size={16} />, label: 'En Meyah desde', value: year } : null,
    company.sitio_web ? { icon: <Globe size={16} />, label: 'Sitio web', value: company.sitio_web, href: safeHttpUrl(company.sitio_web) } : null,
  ]
  const quickRows = quickRowsRaw.filter((r): r is QuickRow => r !== null)

  // Solo afirmaciones REALES: is_verified lo activa un admin de Meyah tras una
  // revisión manual de la empresa, SIN validación de identidad ni documentos (ese
  // flujo es v3 y no existe aún). El copy no debe prometer "identidad verificada"
  // ni "documentación validada". Correo/teléfono son datos de contacto que el
  // empleador llenó; se etiquetan como tales, sin afirmar que fueron validados.
  interface TrustRow { icon: ReactNode; label: string; sub: string }
  const trustRowsRaw: (TrustRow | null)[] = [
    { icon: <ShieldCheck size={12} />, label: 'Empresa verificada', sub: 'Revisada por el equipo de Meyah' },
    company.correo ? { icon: <Mail size={12} />, label: 'Correo de contacto', sub: company.correo } : null,
    company.telefono ? { icon: <Phone size={12} />, label: 'Teléfono de contacto', sub: company.telefono } : null,
  ]
  const trustRows = trustRowsRaw.filter((t): t is TrustRow => t !== null)

  return (
    <div className="bg-meyah-crema-50" style={{ animation: 'fadeIn .3s ease' }}>
      <div className="mx-auto max-w-270 px-4 pt-6 pb-16 sm:px-7">
        {/* Portada + logo + identidad (misma estructura que "Editar empresa") */}
        <CompanyProfileHero
          logoPath={company.logo_path}
          legacyUrl={company.logo_url}
          updatedAt={company.updated_at}
          name={company.nombre}
          bannerOverlay={
            <button
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-2.5 text-[13px] font-semibold text-meyah-jade-900 shadow-xs backdrop-blur hover:bg-white"
            >
              <ArrowLeft size={15} /> Volver a la vacante
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[clamp(24px,4vw,30px)]">{company.nombre}</h1>
            {company.is_verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-meyah-jade-50 px-2.75 py-1.5 text-[12px] font-bold text-meyah-jade-700">
                <ShieldCheck size={14} /> Verificada
              </span>
            )}
          </div>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14px] text-meyah-tinta-600">
            {company.categoria && (
              <span className="inline-flex items-center gap-1.5 font-medium text-meyah-tinta-900">
                <Briefcase size={15} className="text-meyah-jade-600" />{company.categoria}
              </span>
            )}
            {year && (
              <>
                {company.categoria && <span className="text-meyah-border">·</span>}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-meyah-jade-600" />En Meyah desde {year}
                </span>
              </>
            )}
            {sizeLabel && (
              <>
                <span className="text-meyah-border">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={15} className="text-meyah-jade-600" />{sizeLabel}
                </span>
              </>
            )}
          </p>
        </CompanyProfileHero>

        {/* Acciones */}
        <div className="mt-4.5 flex flex-wrap items-center gap-2.5">
          {canInteract && (
            <button
              onClick={handleMessage}
              disabled={startConversation.isPending}
              className="inline-flex items-center gap-2 rounded-field bg-meyah-jade-900 px-5 py-3.25 text-[14px] font-semibold text-white transition hover:bg-meyah-jade-700 disabled:opacity-60"
            >
              <MessageSquare size={16} /> Enviar mensaje
            </button>
          )}
          {canInteract && (
            <button
              onClick={handleFollow}
              className={cn(
                'inline-flex items-center gap-2 rounded-field border-[1.5px] px-4.5 py-3 text-[14px] font-semibold transition',
                follow.isFollowing
                  ? 'border-meyah-jade-500 bg-meyah-jade-500 text-white'
                  : 'border-meyah-jade-100 bg-white text-meyah-jade-700 hover:bg-meyah-jade-50',
              )}
            >
              {follow.isFollowing ? <Check size={16} /> : <UserPlus size={16} />}
              {follow.isFollowing ? 'Siguiendo' : 'Seguir empresa'}
            </button>
          )}
          {canInteract && (
            <button
              onClick={handleSave}
              aria-label={save.isSaved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              className={cn(
                'grid h-11.5 w-11.5 place-items-center rounded-field border-[1.5px] transition',
                save.isSaved
                  ? 'border-meyah-terracota-100 bg-meyah-terracota-50 text-meyah-terracota-500'
                  : 'border-meyah-border bg-white text-meyah-tinta-600 hover:bg-meyah-crema-50',
              )}
            >
              <Bookmark size={18} fill={save.isSaved ? 'currentColor' : 'none'} />
            </button>
          )}
          <button
            onClick={() => void handleShare()}
            aria-label="Compartir perfil"
            className="grid h-11.5 w-11.5 place-items-center rounded-field border-[1.5px] border-meyah-border bg-white text-meyah-tinta-600 transition hover:bg-meyah-crema-50"
          >
            <Share2 size={18} />
          </button>
          {!isOwner && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Más opciones"
                className="grid h-11.5 w-11.5 place-items-center rounded-field border-[1.5px] border-meyah-border bg-white text-meyah-tinta-600 transition hover:bg-meyah-crema-50"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-13 z-20 w-52 rounded-2xl border border-meyah-border-soft bg-white p-1.5 shadow-lg" style={{ animation: 'rise .18s ease' }}>
                    <button
                      onClick={() => { setMenuOpen(false); setReporting(true) }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.75 text-left text-[13.5px] font-medium text-meyah-terracota-500 hover:bg-meyah-terracota-50"
                    >
                      <Briefcase size={16} /> Reportar empresa
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {isOwner && (
            <span className="rounded-full bg-meyah-crema-100 px-3 py-2 text-[12.5px] font-medium text-meyah-tinta-600">
              Vista previa de tu perfil
            </span>
          )}
        </div>

        {typeof followers === 'number' && followers > 0 && (
          <p className="mt-3 text-[13px] text-meyah-tinta-400">
            <span className="font-semibold text-meyah-tinta-900">{followers}</span> {followers === 1 ? 'seguidor' : 'seguidores'}
          </p>
        )}

        {/* Cuerpo en dos columnas */}
        <div className="mt-6 flex flex-col items-start gap-4.5 lg:flex-row">

          {/* MAIN */}
          <div className="flex w-full min-w-0 flex-1 flex-col gap-4.5">
            <section className="rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
              <h2 className="text-[19px]">Acerca de la empresa</h2>
              <p className="mt-3 whitespace-pre-line text-[14.5px] leading-[1.65] text-meyah-tinta-600">{company.descripcion}</p>
            </section>

            {company.historia && (
              <section className="rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7.5 place-items-center rounded-[9px] bg-meyah-terracota-50 text-meyah-terracota-500"><Clock size={16} /></span>
                  <h2 className="text-[19px]">Historia</h2>
                </div>
                <p className="mt-3 whitespace-pre-line text-[14.5px] leading-[1.65] text-meyah-tinta-600">{company.historia}</p>
              </section>
            )}

            {hasMisionVision && (
              <section className="grid gap-5 rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm sm:grid-cols-2">
                {company.mision && (
                  <div>
                    <h3 className="text-[17px]">Misión</h3>
                    <p className="mt-2.5 whitespace-pre-line text-[14px] leading-[1.6] text-meyah-tinta-600">{company.mision}</p>
                  </div>
                )}
                {company.vision && (
                  <div>
                    <h3 className="text-[17px]">Visión</h3>
                    <p className="mt-2.5 whitespace-pre-line text-[14px] leading-[1.6] text-meyah-tinta-600">{company.vision}</p>
                  </div>
                )}
              </section>
            )}

            {hasCultura && (
              <section className="rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7.5 place-items-center rounded-[9px] bg-meyah-terracota-50 text-meyah-terracota-500"><Users size={16} /></span>
                  <h2 className="text-[19px]">Cultura laboral</h2>
                </div>
                {company.valores.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-2.25">
                    {company.valores.map(v => (
                      <span key={v} className="inline-flex items-center gap-1.75 rounded-full border border-meyah-jade-100 bg-meyah-jade-50 px-3.5 py-2.25 text-[13px] font-semibold text-meyah-jade-700">
                        <Check size={13} />{v}
                      </span>
                    ))}
                  </div>
                )}
                {company.beneficios.length > 0 && (
                  <div className="mt-4.5 border-t border-meyah-crema-100 pt-4">
                    <div className="eyebrow mb-3">Beneficios</div>
                    <div className="grid gap-2.75 sm:grid-cols-2">
                      {company.beneficios.map(b => (
                        <div key={b} className="flex items-center gap-2.5 text-[13.5px] text-meyah-tinta-900">
                          <span className="grid size-7.5 flex-none place-items-center rounded-[9px] bg-meyah-crema-50 text-meyah-jade-600"><Check size={15} /></span>
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {jobs && jobs.length > 0 && (
              <section className="rounded-panel border border-meyah-border-soft bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[19px]">Vacantes de {company.nombre}</h2>
                  <span className="rounded-full bg-meyah-jade-50 px-2.75 py-1.5 text-[12.5px] font-semibold text-meyah-jade-700">{jobs.length} activas</span>
                </div>
                <div className="scroll-fade mt-4 flex gap-3.5 overflow-x-auto pb-2.5">
                  {jobs.map(job => (
                    <button
                      key={job.id}
                      type="button"
                      // /vacante/:id es pública: cualquiera (anónimo, candidato o
                      // el propio empleador) puede abrir la vacante desde aquí.
                      onClick={() => navigate(`/vacante/${job.id}`)}
                      className="w-62 flex-none cursor-pointer rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-4.25 text-left transition hover:border-meyah-jade-500 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-meyah-jade-50 px-2.25 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-meyah-jade-700">{getCategoryLabel(job.categoria)}</span>
                      </div>
                      <div className="mt-3 font-display text-[17px] font-semibold leading-[1.2] text-meyah-jade-900">{job.titulo}</div>
                      <div className="mt-2.75 flex items-center gap-1.75 text-[12.5px] font-medium text-meyah-tinta-900">
                        {formatSalary(job.salario_min, job.salario_max)}
                      </div>
                      <div className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-meyah-jade-700">
                        Ver vacante <ChevronRight size={13} />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="flex w-full flex-none flex-col gap-4.5 lg:w-82.5">
            {/* Información rápida */}
            <div className="rounded-panel border border-meyah-border-soft bg-white p-5 shadow-sm">
              <div className="eyebrow">Información rápida</div>
              <div className="mt-3.5 flex flex-col">
                {quickRows.map(row => (
                    <div key={row.label} className="flex items-center gap-2.75 border-t border-meyah-crema-100 py-2.5 first:border-t-0">
                      <span className="grid size-8 flex-none place-items-center rounded-[9px] bg-meyah-crema-50 text-meyah-jade-700">{row.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11.5px] text-meyah-tinta-400">{row.label}</div>
                        {row.href ? (
                          <a href={row.href} target="_blank" rel="noopener noreferrer" className="block truncate text-[13.5px] font-semibold text-meyah-jade-700 hover:underline">{row.value}</a>
                        ) : (
                          <div className="text-[13.5px] font-semibold text-meyah-tinta-900">{row.value}</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Confianza (solo si verificada) */}
            {company.is_verified && (
              <div className="greca relative overflow-hidden rounded-panel bg-[linear-gradient(165deg,#0A3D38,#0E4F47)] p-5.5 shadow-lg">
                <div className="relative">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9.5 place-items-center rounded-[11px] bg-white/12 text-meyah-jade-50"><ShieldCheck size={20} /></span>
                    <div>
                      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-meyah-jade-50/80">Confianza</div>
                      <h3 className="mt-0.5 text-[17px] text-white">Empresa verificada</h3>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3.25">
                    {trustRows.map(t => (
                        <div key={t.label} className="flex items-start gap-2.75">
                          <span className="mt-0.5 grid size-5.25 flex-none place-items-center rounded-full bg-meyah-jade-500 text-white">{t.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13.5px] font-semibold text-white">{t.label}</div>
                            <div className="truncate text-[12px] text-meyah-jade-50/70">{t.sub}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {company.verified_at && (
                    <div className="mt-4 flex items-center gap-2 border-t border-white/12 pt-3.5 text-[12px] text-meyah-jade-50/70">
                      <CalendarDays size={13} /> Verificada el {fmtDate.format(new Date(company.verified_at))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Redes (solo las que tengan valor) */}
            {socials.length > 0 && (
              <div className="rounded-panel border border-meyah-border-soft bg-white p-5 shadow-sm">
                <div className="eyebrow mb-3">Síguelos</div>
                <div className="flex flex-wrap gap-2.5">
                  {socials.map(s => (
                    <a
                      key={s.key}
                      href={socialHref(s.key, s.value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="grid size-11 place-items-center rounded-field border border-meyah-border-soft bg-meyah-crema-50 text-[14px] font-bold text-meyah-tinta-900 transition hover:border-meyah-jade-900 hover:bg-meyah-jade-900 hover:text-white"
                    >
                      {s.glyph}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {reporting && <ReportCompanyDialog companyId={company.id} onClose={() => setReporting(false)} />}
    </div>
  )
}

// Construye un href usable a partir del valor guardado (handle @usuario o URL).
function socialHref(key: string, value: string): string {
  const v = value.trim()
  if (/^https?:\/\//i.test(v)) return v
  const handle = v.replace(/^@/, '')
  switch (key) {
    case 'instagram': return `https://instagram.com/${handle}`
    case 'facebook':  return `https://facebook.com/${handle}`
    case 'linkedin':  return /linkedin\.com/i.test(v) ? `https://${v.replace(/^\/+/, '')}` : `https://linkedin.com/company/${handle}`
    case 'tiktok':    return `https://tiktok.com/@${handle}`
    case 'x':         return `https://x.com/${handle}`
    default:          return v
  }
}
