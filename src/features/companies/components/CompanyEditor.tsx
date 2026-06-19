import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  Building2, Camera, Check, Clock, Eye, Image as ImageIcon,
  Loader2, MapPin, Pencil, Share2, ShieldCheck, Sparkles,
} from 'lucide-react'

import type { Company } from '@/shared/types'
import { useUpdateCompany } from '@/features/companies/hooks/useUpdateCompany'
import { useUploadCompanyLogo } from '@/features/companies/hooks/useUploadCompanyLogo'
import { companySchema } from '@/features/companies/schemas/companySchema'
import type { CompanyFormInput, CompanyFormValues } from '@/features/companies/schemas/companySchema'
import {
  companySizeLabel, parseHorarios,
} from '@/features/companies/schemas/companyMeta'
import BottomSheet from '@/features/companies/components/BottomSheet'
import CompanyProfileHero from '@/features/companies/components/CompanyProfileHero'
import {
  HistoriaCulturaFields, HorariosFields, InfoFields, RedesFields, UbicacionFields,
  VisibleBadge,
} from '@/features/companies/components/CompanyFieldGroups'
import type { SectionKey } from '@/features/companies/components/CompanyFieldGroups'
import { Button } from '@/shared/ui/button'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/utils'
import { MERIDA_CENTER } from '@/shared/lib/geo'

interface CompanyEditorProps {
  company: Company
  city?: string
}

const SHEET_TITLE: Record<SectionKey, string> = {
  info: 'Información general',
  historia: 'Historia y cultura',
  ubicacion: 'Ubicación y cobertura',
  redes: 'Redes sociales',
  horarios: 'Horarios de atención',
}

export default function CompanyEditor({ company, city = 'Mérida, Yucatán' }: CompanyEditorProps) {
  const navigate = useNavigate()
  const updateMutation = useUpdateCompany()
  const { uploadLogo, isUploading: logoUploading } = useUploadCompanyLogo(company.id)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [activeSheet, setActiveSheet] = useState<SectionKey | null>(null)

  // Un único input oculto sirve a ambos botones de cámara (móvil/desktop).
  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    uploadLogo(file, {
      onSuccess: () => toast.success('Logo actualizado'),
      onError: err => toast.error(err.message),
    })
  }

  const methods = useForm<CompanyFormInput, unknown, CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nombre: company.nombre,
      descripcion: company.descripcion,
      direccion: company.direccion,
      sitio_web: company.sitio_web ?? '',
      lat: company.lat ?? MERIDA_CENTER[0],
      lng: company.lng ?? MERIDA_CENTER[1],
      razon_social: company.razon_social ?? '',
      correo: company.correo ?? '',
      telefono: company.telefono ?? '',
      // El valor en BD es uno de los enum o null; lo normalizamos a '' para el
      // <select>. El cast acota el string genérico al union esperado por el form.
      categoria: (company.categoria ?? '') as CompanyFormInput['categoria'],
      tamano: (company.tamano ?? '') as CompanyFormInput['tamano'],
      historia: company.historia ?? '',
      mision: company.mision ?? '',
      vision: company.vision ?? '',
      valores: company.valores ?? [],
      beneficios: company.beneficios ?? [],
      radio_km: company.radio_km ?? null,
      horarios: parseHorarios(company.horarios),
      instagram: company.instagram ?? '',
      facebook: company.facebook ?? '',
      linkedin: company.linkedin ?? '',
      tiktok: company.tiktok ?? '',
      x: company.x ?? '',
    },
  })

  const { watch, handleSubmit, getValues, formState: { isDirty } } = methods
  const w = watch()

  const onSubmit = (data: CompanyFormValues, opts?: { closeSheet?: boolean }) => {
    updateMutation.mutate(
      { id: company.id, data },
      {
        onSuccess: () => {
          toast.success('Cambios guardados')
          if (opts?.closeSheet) setActiveSheet(null)
          methods.reset(getValues())
        },
        onError: () => toast.error('No se pudieron guardar los cambios.'),
      },
    )
  }

  // onInvalid: sin esto, guardar con un campo requerido inválido (p. ej. una
  // descripción legacy demasiado corta) abortaba en silencio — el sheet quedaba
  // "colgado" sin toast ni cierre. Ahora avisamos.
  const onInvalid = () => toast.error('Revisa los campos obligatorios antes de guardar.')
  const saveAll = handleSubmit(d => onSubmit(d), onInvalid)
  const saveFromSheet = handleSubmit(d => onSubmit(d, { closeSheet: true }), onInvalid)

  // ── Completitud (datos reales) ──────────────────────────────────────────────
  const items = [
    { key: 'info', label: 'Información básica', ok: !!(w.nombre && w.descripcion) },
    { key: 'info', label: 'Categoría y tamaño', ok: !!(w.categoria && w.tamano) },
    { key: 'info', label: 'Correo y teléfono', ok: !!(w.correo && w.telefono) },
    { key: 'info', label: 'Sitio web', ok: !!w.sitio_web },
    { key: 'historia', label: 'Historia y cultura', ok: !!(w.historia || w.mision || w.vision || (w.valores ?? []).length) },
    { key: 'redes', label: 'Redes sociales', ok: !!(w.instagram || w.facebook || w.linkedin || w.tiktok || w.x) },
    { key: 'verificacion', label: 'Empresa verificada', ok: company.is_verified },
  ] as const
  const okCount = items.filter(i => i.ok).length
  const pct = Math.round((okCount / items.length) * 100)
  const faltan = items.length - okCount

  const recos = items.filter(i => !i.ok && i.key !== 'verificacion')

  const openSection = (key: string) => {
    if (key === 'verificacion') { toast.info('Verifica tu empresa subiendo tus documentos.'); return }
    setActiveSheet(key as SectionKey)
    document.getElementById(`sec-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const sizeLabel = companySizeLabel(w.tamano)
  const saving = updateMutation.isPending

  // Secciones inline para desktop.
  const sections: { key: SectionKey; title: string; icon: typeof Building2; Body: () => ReactNode }[] = [
    { key: 'info', title: 'Información general', icon: Building2, Body: InfoFields },
    { key: 'historia', title: 'Historia y cultura', icon: Clock, Body: HistoriaCulturaFields },
    { key: 'ubicacion', title: 'Ubicación y cobertura', icon: MapPin, Body: UbicacionFields },
    { key: 'redes', title: 'Redes sociales', icon: Share2, Body: RedesFields },
    { key: 'horarios', title: 'Horarios de atención', icon: Clock, Body: HorariosFields },
  ]

  const navItems = [
    { key: 'info', label: 'Información general', done: items.find(i => i.label === 'Información básica')?.ok },
    { key: 'historia', label: 'Historia y cultura', done: !!(w.historia || w.mision || w.vision || (w.valores ?? []).length) },
    { key: 'ubicacion', label: 'Ubicación', done: !!w.direccion },
    { key: 'redes', label: 'Redes sociales', done: !!(w.instagram || w.facebook || w.linkedin || w.tiktok || w.x) },
    { key: 'horarios', label: 'Horarios', done: !!w.horarios?.lun_vie },
    { key: 'verificacion', label: 'Verificación', done: company.is_verified },
  ]

  return (
    <FormProvider {...methods}>
      <form onSubmit={saveAll} noValidate>

        {/* Input oculto compartido por ambos botones de cámara (móvil/desktop). */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleLogoFile}
          className="hidden"
        />

        {/* ════════ MÓVIL ════════ */}
        {!isDesktop && (
        <div>
          {/* Encabezado */}
          <CompanyProfileHero
            logoPath={company.logo_path}
            legacyUrl={company.logo_url}
            updatedAt={company.updated_at}
            name={w.nombre || company.nombre}
            bannerOverlay={
              <button type="button" onClick={() => toast.info('Próximamente: cambiar portada')} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-3 py-2 text-[12px] font-semibold text-meyah-jade-900 shadow-xs">
                <ImageIcon size={13} /> Editar portada
              </button>
            }
            logoAction={
              <button type="button" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} aria-label="Cambiar logo" className="absolute -bottom-1 -right-1 grid size-7.5 place-items-center rounded-full border-[3px] border-white bg-meyah-tinta-900 text-white disabled:opacity-60">
                {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </button>
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[21px]">{w.nombre || company.nombre}</h2>
                  {company.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-meyah-jade-50 px-2.25 py-1 text-[11.5px] font-bold text-meyah-jade-700"><ShieldCheck size={12} /> Verificada</span>
                  )}
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13.5px] text-meyah-tinta-600">
                  {w.categoria && <span className="inline-flex items-center gap-1.5 font-medium text-meyah-tinta-900"><Building2 size={14} className="text-meyah-jade-600" />{w.categoria}</span>}
                  {w.categoria && <span className="text-meyah-border">·</span>}
                  <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-meyah-jade-600" />{city}</span>
                </p>
              </div>
              <button type="button" onClick={() => navigate(`/empresas/${company.id}`)} className="inline-flex flex-none items-center gap-1.5 rounded-full border border-meyah-border bg-white px-3.5 py-2.5 text-[13px] font-semibold text-meyah-jade-700 shadow-xs hover:bg-meyah-jade-50">
                <Eye size={14} /> Vista pública
              </button>
            </div>
          </CompanyProfileHero>

          {/* Completitud */}
          <CompletionCard pct={pct} faltan={faltan} items={items} recos={recos} onReco={openSection} />

          {/* Verificación */}
          <VerificationCard isVerified={company.is_verified} verifiedAt={company.verified_at} />

          {/* Tarjetas-resumen con Editar */}
          <SummaryCard title="Información general" eyebrow="Datos" icon={Building2} onEdit={() => setActiveSheet('info')}>
            <p className="line-clamp-2 text-[13.5px] text-meyah-tinta-600">{w.descripcion}</p>
            <dl className="mt-2.5 flex flex-col">
              <SummaryRow label="Categoría" value={w.categoria || '—'} />
              <SummaryRow label="Empleados" value={sizeLabel ?? '—'} />
              <SummaryRow label="Correo" value={w.correo || '—'} />
              <SummaryRow label="Teléfono" value={w.telefono || '—'} />
              <SummaryRow label="Sitio web" value={w.sitio_web || 'Agregar sitio web'} muted={!w.sitio_web} />
            </dl>
          </SummaryCard>

          <SummaryCard title="Historia y cultura" eyebrow="Tu marca" icon={Sparkles} onEdit={() => setActiveSheet('historia')}>
            {w.historia || w.mision || w.vision || (w.valores ?? []).length
              ? (
                <div className="flex flex-col gap-2">
                  {w.historia && <p className="line-clamp-2 text-[13.5px] text-meyah-tinta-600">{w.historia}</p>}
                  {(w.valores ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(w.valores ?? []).slice(0, 4).map(v => <span key={v} className="rounded-full bg-meyah-jade-50 px-2.5 py-1 text-[12px] font-semibold text-meyah-jade-700">{v}</span>)}
                    </div>
                  )}
                </div>
              )
              : <p className="text-[13.5px] text-meyah-tinta-400">Cuéntale al candidato tu historia, misión, valores y beneficios.</p>}
          </SummaryCard>

          <SummaryCard title="Ubicación y cobertura" eyebrow="Dónde estás" icon={MapPin} onEdit={() => setActiveSheet('ubicacion')}>
            <p className="text-[13.5px] text-meyah-tinta-600">{w.direccion}</p>
            <p className="mt-1.5 text-[12.5px] text-meyah-tinta-400">Radio de contratación: {w.radio_km ?? '—'} km</p>
          </SummaryCard>

          <SummaryCard title="Redes sociales" eyebrow="Presencia" icon={Share2} onEdit={() => setActiveSheet('redes')}>
            <p className="text-[13.5px] text-meyah-tinta-600">
              {[w.instagram, w.facebook, w.linkedin, w.tiktok, w.x].filter(Boolean).length || 'Sin'} redes conectadas
            </p>
          </SummaryCard>

          <SummaryCard title="Horarios de atención" eyebrow="Atención" icon={Clock} onEdit={() => setActiveSheet('horarios')}>
            <p className="text-[13.5px] text-meyah-tinta-600">{w.horarios?.lun_vie ? `Lun–Vie ${w.horarios.lun_vie}` : 'Sin horarios configurados'}</p>
          </SummaryCard>
        </div>
        )}

        {/* ════════ DESKTOP ════════ */}
        {isDesktop && (
        <div className="flex gap-6">
          {/* Nav lateral */}
          <aside className="sticky top-24 h-fit w-60 flex-none">
            <div className="rounded-panel border border-meyah-border-soft bg-white p-3 shadow-sm">
              <div className="px-2.5 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-meyah-tinta-400">Secciones</div>
              <div className="flex flex-col gap-0.5">
                {navItems.map(n => (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => document.getElementById(`sec-${n.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="flex items-center gap-2.5 rounded-xl px-2.75 py-2.5 text-left text-[13.5px] font-semibold text-meyah-tinta-600 transition hover:bg-meyah-crema-50 hover:text-meyah-jade-900"
                  >
                    <span className="flex-1">{n.label}</span>
                    {n.done
                      ? <Check size={15} className="text-meyah-jade-500" />
                      : <span className="size-2 rounded-full bg-meyah-terracota-500/70" />}
                  </button>
                ))}
              </div>
              <div className="mt-3 border-t border-meyah-crema-100 px-2.5 pt-3">
                <div className="mb-2 flex items-center justify-between"><span className="text-[12px] font-semibold text-meyah-tinta-600">Perfil completo</span><span className="text-[13px] font-bold text-meyah-jade-700">{pct}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-meyah-crema-100"><div className="h-full rounded-full bg-linear-to-r from-meyah-jade-500 to-meyah-jade-600 transition-[width] duration-700" style={{ width: `${pct}%` }} /></div>
              </div>
            </div>
          </aside>

          {/* Contenido */}
          <div className="min-w-0 flex-1">
            {/* Top bar */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1 text-[13px] font-medium text-meyah-jade-700">
                {saving
                  ? <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Guardando…</span>
                  : isDirty
                    ? <span className="text-meyah-terracota-700">Tienes cambios sin guardar</span>
                    : <span className="inline-flex items-center gap-1.5"><Check size={14} /> Todo guardado</span>}
              </div>
              <button type="button" onClick={() => navigate(`/empresas/${company.id}`)} className="inline-flex items-center gap-2 rounded-field border border-meyah-border bg-white px-3.75 py-2.75 text-[13px] font-semibold text-meyah-jade-700 hover:bg-meyah-jade-50">
                <Eye size={15} /> Ver como candidato
              </button>
              <Button type="submit" disabled={saving || !isDirty}>Guardar cambios</Button>
            </div>

            {/* Identity card */}
            <div className="rounded-panel border border-meyah-border-soft bg-white pb-5 shadow-sm">
              <CompanyProfileHero
                logoPath={company.logo_path}
                legacyUrl={company.logo_url}
                updatedAt={company.updated_at}
                name={w.nombre || company.nombre}
                logoAction={
                  <button type="button" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} aria-label="Cambiar logo" className="absolute -bottom-1 -right-1 grid size-7.5 place-items-center rounded-full border-[3px] border-white bg-meyah-tinta-900 text-white disabled:opacity-60">
                    {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                  </button>
                }
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[20px]">{w.nombre || company.nombre}</h2>
                  {company.is_verified
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-meyah-jade-50 px-2.25 py-1 text-[11px] font-bold text-meyah-jade-700"><ShieldCheck size={12} /> Verificada</span>
                    : <span className="rounded-full bg-meyah-terracota-50 px-2.25 py-1 text-[11px] font-bold text-meyah-terracota-700">No verificada</span>}
                </div>
                <div className="mt-1.5 text-[13px] text-meyah-tinta-400">{w.categoria || 'Sin categoría'} · {city}</div>
              </CompanyProfileHero>
            </div>

            {/* Completion (desktop, compact) */}
            <div className="mt-4">
              <CompletionCard pct={pct} faltan={faltan} items={items} recos={recos} onReco={openSection} />
            </div>

            {/* Secciones inline */}
            {sections.map(({ key, title, icon: Icon, Body }) => (
              <section key={key} id={`sec-${key}`} className="mt-4 scroll-mt-24 rounded-panel border border-meyah-border-soft bg-white p-5.5 shadow-sm">
                <div className="mb-4.5 flex items-center gap-2.75">
                  <span className="grid size-8.5 flex-none place-items-center rounded-[10px] bg-meyah-jade-50 text-meyah-jade-700"><Icon size={17} /></span>
                  <h3 className="flex-1 text-[17px]">{title}</h3>
                  {key !== 'horarios' && <VisibleBadge />}
                </div>
                <Body />
              </section>
            ))}

            {/* Verificación */}
            <section id="sec-verificacion" className="mt-4 scroll-mt-24">
              <VerificationCard isVerified={company.is_verified} verifiedAt={company.verified_at} />
            </section>
          </div>
        </div>
        )}

        {/* Sheet de edición (solo móvil; no se monta en desktop) */}
        {!isDesktop && activeSheet && (
          <BottomSheet
            title={SHEET_TITLE[activeSheet]}
            onClose={() => setActiveSheet(null)}
            footer={
              <div className="flex gap-2.5">
                <Button type="button" variant="outline" onClick={() => setActiveSheet(null)}>Cancelar</Button>
                <Button type="button" className="flex-1" disabled={saving} onClick={() => void saveFromSheet()}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            }
          >
            <SheetBody section={activeSheet} />
          </BottomSheet>
        )}
      </form>
    </FormProvider>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function SheetBody({ section }: { section: SectionKey }) {
  switch (section) {
    case 'info': return <InfoFields />
    case 'historia': return <HistoriaCulturaFields />
    case 'ubicacion': return <UbicacionFields />
    case 'redes': return <RedesFields />
    case 'horarios': return <HorariosFields />
  }
}

interface CompletionItem { label: string; ok: boolean }

function CompletionCard({
  pct, faltan, items, recos, onReco,
}: {
  pct: number
  faltan: number
  items: readonly CompletionItem[]
  recos: readonly { key: string; label: string }[]
  onReco: (key: string) => void
}) {
  return (
    <div className="mt-3.5 rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm">
      <div className="flex items-center gap-2.75">
        <span className="grid size-8.5 flex-none place-items-center rounded-[11px] bg-meyah-terracota-50 text-meyah-terracota-500"><Sparkles size={17} /></span>
        <div className="flex-1">
          <div className="eyebrow">Tu perfil</div>
          <h3 className="mt-0.5 text-[16.5px]">Completa tu perfil</h3>
        </div>
        <div className="font-display text-[26px] font-semibold leading-none text-meyah-jade-700">{pct}%</div>
      </div>
      <div className="mt-3 h-2.25 overflow-hidden rounded-full bg-meyah-crema-100">
        <div className="h-full rounded-full bg-linear-to-r from-meyah-jade-500 to-meyah-jade-600 transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2.75 text-[13px] text-meyah-tinta-600">
        {faltan === 0
          ? <span className="font-semibold text-meyah-jade-700">¡Tu perfil está completo! Generas más confianza ante los candidatos.</span>
          : <>Te falta completar <strong className="text-meyah-tinta-900">{faltan} {faltan === 1 ? 'paso' : 'pasos'}</strong> para dar más confianza a los candidatos.</>}
      </p>
      {recos.length > 0 && (
        <div className="scroll-fade mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {recos.map(r => (
            <button key={r.label} type="button" onClick={() => onReco(r.key)} className="inline-flex flex-none items-center gap-1.5 rounded-full border border-meyah-terracota-100 bg-meyah-terracota-50 px-3.25 py-2.25 text-[12.5px] font-semibold text-meyah-terracota-700 hover:bg-meyah-terracota-100">
              {r.label}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-3.5 flex flex-col gap-0.5">
        {items.map(it => (
          <li key={it.label} className="flex items-center gap-2.5 py-1">
            {it.ok
              ? <span className="grid size-4.75 flex-none place-items-center rounded-full bg-meyah-jade-500 text-white"><Check size={11} /></span>
              : <span className="size-4.75 flex-none rounded-full border-2 border-meyah-border" />}
            <span className={cn('text-[13.5px]', it.ok ? 'text-meyah-tinta-400 line-through decoration-meyah-border' : 'font-medium text-meyah-tinta-900')}>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VerificationCard({ isVerified, verifiedAt }: { isVerified: boolean; verifiedAt: string | null }) {
  return (
    <div className="mt-3.5 overflow-hidden rounded-panel border border-meyah-border-soft bg-white shadow-sm lg:mt-0">
      <div className="p-4.5">
        <div className="flex items-center gap-2.75">
          <span className="grid size-8.5 flex-none place-items-center rounded-[11px] bg-meyah-jade-50 text-meyah-jade-700"><ShieldCheck size={17} /></span>
          <div className="flex-1">
            <div className="eyebrow">Confianza</div>
            <h3 className="mt-0.5 text-[16.5px]">Verificación de empresa</h3>
          </div>
          {isVerified
            ? <span className="inline-flex items-center gap-1 rounded-full bg-meyah-jade-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-meyah-jade-700"><Check size={12} /> Verificada</span>
            : <span className="rounded-full bg-meyah-crema-100 px-2.5 py-1.5 text-[11.5px] font-semibold text-meyah-tinta-600">No verificada</span>}
        </div>
        <p className="mt-3 text-[13px] leading-normal text-meyah-tinta-600">
          {isVerified
            ? <>Tu insignia de verificación es visible para los candidatos{verifiedAt ? ` desde el ${new Date(verifiedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.</>
            : 'Verifica tu empresa para mostrar la insignia verificada y ganar la confianza de los candidatos.'}
        </p>
      </div>
      {!isVerified && (
        // FUTURO: flujo real de subida de documentos a revisión (verification_status
        // 'pending' + tabla verification_requests + bucket de documentos). Hoy la
        // verificación la activa un admin vía verify_company(); este botón es un
        // placeholder que solo informa al empleador.
        <button
          type="button"
          onClick={() => toast.info('Próximamente: subir documentos para verificación')}
          className="flex w-full items-center justify-center gap-2 border-t border-meyah-border-soft bg-meyah-jade-900 py-3.75 text-[14px] font-semibold text-white hover:bg-meyah-jade-700"
        >
          <ShieldCheck size={16} /> Subir documentos
        </button>
      )}
    </div>
  )
}

function SummaryCard({
  title, eyebrow, icon: Icon, onEdit, children,
}: {
  title: string
  eyebrow: string
  icon: typeof Building2
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <div className="mt-3.5 rounded-panel border border-meyah-border-soft bg-white p-4.5 shadow-sm">
      <div className="mb-2.5 flex items-center gap-2.75">
        <span className="grid size-8.5 flex-none place-items-center rounded-[11px] bg-meyah-jade-50 text-meyah-jade-700"><Icon size={17} /></span>
        <div className="flex-1">
          <div className="eyebrow">{eyebrow}</div>
          <h3 className="mt-0.5 text-[16.5px]">{title}</h3>
        </div>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full bg-meyah-jade-50 px-3 py-2 text-[12.5px] font-semibold text-meyah-jade-700 hover:bg-meyah-jade-100">
          <Pencil size={12} /> Editar
        </button>
      </div>
      {children}
    </div>
  )
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-t border-meyah-crema-100 py-2.5 first:border-t-0">
      <span className="w-28 flex-none text-[12.5px] text-meyah-tinta-400">{label}</span>
      <span className={cn('flex-1 wrap-break-word text-right text-[13.5px] font-medium', muted ? 'text-meyah-terracota-500' : 'text-meyah-tinta-900')}>{value}</span>
    </div>
  )
}
