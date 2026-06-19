import { useState } from 'react'
import type { ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'
import { Eye, Loader2, MapPin, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import type { CompanyFormInput, CompanyFormValues } from '@/features/companies/schemas/companySchema'
import {
  COMPANY_CATEGORIES, COMPANY_SIZES, SOCIAL_FIELDS,
} from '@/features/companies/schemas/companyMeta'
import LocationPicker from '@/features/jobs/components/LocationPicker'
import { geocodeAddress } from '@/shared/lib/geocode'
import { MERIDA_CENTER } from '@/shared/lib/geo'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'

/** Badge "Visible" que marca un campo que aparece en el perfil público. */
export function VisibleBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-meyah-jade-50 px-2 py-0.75 text-[10.5px] font-semibold text-meyah-jade-700">
      <Eye size={11} /> Visible
    </span>
  )
}

const selectCls =
  'w-full rounded-field border border-meyah-border bg-white px-3.25 py-2.75 text-[14px] text-meyah-tinta-900 outline-none transition focus:border-meyah-jade-500'

function FieldLabel({ children, visible }: { children: ReactNode; visible?: boolean }) {
  return (
    <span className="mb-1.75 flex items-center gap-1.5 text-[12.5px] font-semibold text-meyah-tinta-900">
      {children}
      {visible && <VisibleBadge />}
    </span>
  )
}

// ── Información general ───────────────────────────────────────────────────────
export function InfoFields() {
  const { register, formState: { errors } } = useFormContext<CompanyFormInput, unknown, CompanyFormValues>()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <FieldLabel visible>Nombre comercial</FieldLabel>
        <Input {...register('nombre')} aria-invalid={!!errors.nombre} />
        {errors.nombre && <p className="mt-1 text-[12.5px] text-meyah-terracota-700">{errors.nombre.message}</p>}
      </label>
      <label className="block">
        <FieldLabel>Razón social</FieldLabel>
        <Input {...register('razon_social')} placeholder="Razón social, S.A. de C.V." />
      </label>
      <label className="block">
        <FieldLabel visible>Categoría</FieldLabel>
        <select className={selectCls} {...register('categoria')}>
          <option value="">Sin especificar</option>
          {COMPANY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <FieldLabel visible>Descripción</FieldLabel>
        <Textarea rows={3} {...register('descripcion')} aria-invalid={!!errors.descripcion} placeholder="¿A qué se dedica la empresa?" />
        {errors.descripcion && <p className="mt-1 text-[12.5px] text-meyah-terracota-700">{errors.descripcion.message}</p>}
      </label>
      <label className="block">
        <FieldLabel visible>Correo empresarial</FieldLabel>
        <Input type="email" {...register('correo')} aria-invalid={!!errors.correo} placeholder="hola@empresa.mx" />
        {errors.correo && <p className="mt-1 text-[12.5px] text-meyah-terracota-700">{errors.correo.message}</p>}
      </label>
      <label className="block">
        <FieldLabel visible>Teléfono</FieldLabel>
        <Input {...register('telefono')} placeholder="999 123 4567" />
      </label>
      <label className="block">
        <FieldLabel visible>Sitio web <span className="font-normal text-meyah-tinta-400">(opcional)</span></FieldLabel>
        <Input type="url" {...register('sitio_web')} aria-invalid={!!errors.sitio_web} placeholder="https://miempresa.com" />
        {errors.sitio_web && <p className="mt-1 text-[12.5px] text-meyah-terracota-700">{errors.sitio_web.message}</p>}
      </label>
      <label className="block">
        <FieldLabel visible>Número de empleados</FieldLabel>
        <select className={selectCls} {...register('tamano')}>
          <option value="">Sin especificar</option>
          {COMPANY_SIZES.map(s => <option key={s.value} value={s.value}>{s.name} · {s.range}</option>)}
        </select>
      </label>
    </div>
  )
}

// ── Editor de chips (valores / beneficios) ───────────────────────────────────
function ChipListEditor({
  name, placeholder, max,
}: { name: 'valores' | 'beneficios'; placeholder: string; max: number }) {
  const { watch, setValue } = useFormContext<CompanyFormInput, unknown, CompanyFormValues>()
  const [draft, setDraft] = useState('')
  const items = (watch(name) ?? []) as string[]

  const add = () => {
    const v = draft.trim()
    if (!v || items.length >= max || items.includes(v)) { setDraft(''); return }
    setValue(name, [...items, v], { shouldDirty: true, shouldValidate: true })
    setDraft('')
  }
  const remove = (i: number) =>
    setValue(name, items.filter((_, k) => k !== i), { shouldDirty: true, shouldValidate: true })

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={it} className="inline-flex items-center gap-1.75 rounded-full border border-meyah-jade-100 bg-meyah-jade-50 py-2 pl-3.25 pr-2 text-[13px] font-semibold text-meyah-jade-700">
            {it}
            <button type="button" onClick={() => remove(i)} aria-label={`Quitar ${it}`} className="grid size-4.5 place-items-center rounded-full bg-meyah-jade-700/12 text-meyah-jade-700 hover:bg-meyah-jade-700/20">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      {items.length < max && (
        <div className="mt-2.5 flex gap-2">
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            placeholder={placeholder}
            className="flex-1"
          />
          <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-field bg-meyah-terracota-50 px-3.5 text-[13px] font-semibold text-meyah-terracota-700 hover:bg-meyah-terracota-100">
            <Plus size={14} /> Agregar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Historia y cultura ───────────────────────────────────────────────────────
export function HistoriaCulturaFields() {
  const { register } = useFormContext<CompanyFormInput, unknown, CompanyFormValues>()
  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <FieldLabel visible>Historia de la empresa</FieldLabel>
        <Textarea rows={3} {...register('historia')} placeholder="¿Cómo nació la empresa?" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <FieldLabel visible>Misión</FieldLabel>
          <Textarea rows={3} {...register('mision')} placeholder="¿Cuál es su propósito?" />
        </label>
        <label className="block">
          <FieldLabel visible>Visión</FieldLabel>
          <Textarea rows={3} {...register('vision')} placeholder="¿Hacia dónde va?" />
        </label>
      </div>
      <div>
        <FieldLabel visible>Valores y cultura</FieldLabel>
        <ChipListEditor name="valores" placeholder="Ej. Trabajo en equipo" max={12} />
      </div>
      <div>
        <FieldLabel visible>Beneficios</FieldLabel>
        <ChipListEditor name="beneficios" placeholder="Ej. Prestaciones de ley" max={12} />
      </div>
    </div>
  )
}

// ── Ubicación y cobertura ────────────────────────────────────────────────────
export function UbicacionFields() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<CompanyFormInput, unknown, CompanyFormValues>()
  const lat = (watch('lat') as number | null | undefined) ?? MERIDA_CENTER[0]
  const lng = (watch('lng') as number | null | undefined) ?? MERIDA_CENTER[1]
  const radio = (watch('radio_km') as number | null | undefined) ?? 8
  const direccion = watch('direccion')
  const [geocoding, setGeocoding] = useState(false)

  // Mismo patrón que CompanyForm (creación): geocodifica la dirección y mueve el
  // pin reutilizando la util de Nominatim (1 req/seg). Con BUG 1 corregido, el
  // LocationPicker recentra al cambiar lat/lng. La edición manual del pin sigue.
  const handleLocate = async () => {
    const q = (direccion ?? '').trim()
    if (!q) {
      toast.error('Escribe primero la dirección para ubicarla en el mapa.')
      return
    }
    setGeocoding(true)
    try {
      const result = await geocodeAddress(q)
      if (result) {
        setValue('lat', result.lat, { shouldDirty: true })
        setValue('lng', result.lng, { shouldDirty: true })
        toast.success('Ubicación encontrada. Ajusta el pin si hace falta.')
      } else {
        toast.error('No encontramos esa dirección en Mérida. Arrastra el pin directamente.')
      }
    } catch {
      toast.error('No se pudo buscar la dirección. Intenta de nuevo.')
    } finally {
      setGeocoding(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <FieldLabel visible>Dirección completa</FieldLabel>
        <Textarea rows={2} {...register('direccion')} aria-invalid={!!errors.direccion} />
        {errors.direccion && <p className="mt-1 text-[12.5px] text-meyah-terracota-700">{errors.direccion.message}</p>}
      </label>
      <button
        type="button"
        onClick={() => void handleLocate()}
        disabled={geocoding}
        className="inline-flex w-fit items-center gap-1.5 rounded-field bg-meyah-terracota-50 px-3.5 py-2 text-[13px] font-semibold text-meyah-terracota-700 transition hover:bg-meyah-terracota-100 disabled:opacity-60"
      >
        {geocoding ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
        Ubicar en el mapa
      </button>
      <div className="h-56 overflow-hidden rounded-card border border-meyah-border-soft">
        <LocationPicker
          lat={lat}
          lng={lng}
          onChange={(newLat, newLng) => {
            setValue('lat', newLat, { shouldDirty: true })
            setValue('lng', newLng, { shouldDirty: true })
          }}
        />
      </div>
      <div className="rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold text-meyah-tinta-900">Radio de contratación</span>
          <span className="font-display text-[17px] font-semibold text-meyah-jade-700">{radio} km</span>
        </div>
        <input
          type="range" min={1} max={25} value={radio}
          onChange={e => setValue('radio_km', Number(e.target.value), { shouldDirty: true })}
          className="mt-2.5 w-full cursor-pointer accent-meyah-jade-500"
        />
        <p className="mt-1 text-[12px] text-meyah-tinta-400">Distancia hasta la que quieres alcanzar candidatos.</p>
      </div>
    </div>
  )
}

// ── Redes sociales ───────────────────────────────────────────────────────────
export function RedesFields() {
  const { register } = useFormContext<CompanyFormInput, unknown, CompanyFormValues>()
  return (
    <div className="flex flex-col gap-3">
      {SOCIAL_FIELDS.map(s => (
        <label key={s.key} className="flex items-center gap-3">
          <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-meyah-tinta-900 text-[13px] font-bold text-white">{s.glyph}</span>
          <Input {...register(s.key)} placeholder={s.placeholder} className="flex-1" />
        </label>
      ))}
    </div>
  )
}

// ── Horarios de atención ─────────────────────────────────────────────────────
export function HorariosFields() {
  const { register, watch } = useFormContext<CompanyFormInput, unknown, CompanyFormValues>()
  const abreSab = !!watch('horarios.abre_sab')
  const abreDom = !!watch('horarios.abre_dom')
  return (
    <div className="flex flex-col gap-3.5">
      <label className="block">
        <FieldLabel>Lunes a viernes</FieldLabel>
        <Input {...register('horarios.lun_vie')} placeholder="9:00 – 18:00" />
      </label>
      <label className="flex items-center gap-3 rounded-field border border-meyah-border bg-white px-3.5 py-2.75">
        <span className="flex-1 text-[14px] font-medium text-meyah-tinta-900">Abre sábados</span>
        <input type="checkbox" {...register('horarios.abre_sab')} className="size-5 accent-meyah-jade-500" />
      </label>
      {abreSab && (
        <label className="block">
          <FieldLabel>Sábado</FieldLabel>
          <Input {...register('horarios.sab')} placeholder="9:00 – 14:00" />
        </label>
      )}
      <label className="flex items-center gap-3 rounded-field border border-meyah-border bg-white px-3.5 py-2.75">
        <span className="flex-1 text-[14px] font-medium text-meyah-tinta-900">Abre domingos</span>
        <input type="checkbox" {...register('horarios.abre_dom')} className="size-5 accent-meyah-jade-500" />
      </label>
      {abreDom && (
        <label className="block">
          <FieldLabel>Domingo</FieldLabel>
          <Input {...register('horarios.dom')} placeholder="10:00 – 14:00" />
        </label>
      )}
    </div>
  )
}

// Secciones del editor de empresa (móvil = sheets, desktop = inline).
export type SectionKey = 'info' | 'historia' | 'ubicacion' | 'redes' | 'horarios'
