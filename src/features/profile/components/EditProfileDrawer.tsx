import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BellOff, MapPin, X } from 'lucide-react'

import LocationPicker from '@/features/jobs/components/LocationPicker'
import { profileSchema } from '@/features/profile/schemas/profile.schema'
import type { ProfileSchemaInput, ProfileSchemaOutput } from '@/features/profile/schemas/profile.schema'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { MERIDA_CENTER } from '@/shared/lib/geo'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'

interface EditProfileDrawerProps {
  open: boolean
  onClose: () => void
  defaultValues: ProfileSchemaInput & { profesion?: string; bio?: string }
  email: string | null
  roleLabel: string
  onSubmit: (values: ProfileSchemaOutput) => void
  isSubmitting: boolean
}

export default function EditProfileDrawer({ open, onClose, defaultValues, email, roleLabel, onSubmit, isSubmitting }: EditProfileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileSchemaInput, unknown, ProfileSchemaOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  // Reset form when drawer opens with fresh defaults
  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Trap de foco + Escape + scroll lock + restauración (espejo de BottomSheet).
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    const prevOverflow = document.body.style.overflow
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  const lat = watch('lat_referencia')
  const lng = watch('lng_referencia')
  const radio = watch('radio_busqueda_km')
  const bio = watch('bio') ?? ''
  const tieneUbicacion = lat != null && lng != null
  const esCand = roleLabel === 'Candidato'

  if (!open) return null

  const field = 'w-full rounded-field border border-meyah-border bg-white px-3.5 py-2.5 text-[14.5px] text-meyah-tinta-900 outline-none transition placeholder:text-meyah-tinta-400 focus:border-meyah-jade-500 focus:ring-[3px] focus:ring-meyah-jade-500/20'
  const lbl = 'text-[13px] font-semibold text-meyah-tinta-900'

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-stretch sm:justify-end">
      <div className="absolute inset-0 bg-meyah-tinta-900/35 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Editar tu perfil"
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-panel bg-meyah-crema-50 shadow-lg sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-panel"
        style={{ animation: 'rise .35s cubic-bezier(.2,.7,.3,1) both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-meyah-border-soft px-6 py-4">
          <div>
            <span className="eyebrow">Editar</span>
            <h3 className="text-[20px]">Tu perfil</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-4">
              {/* Nombre */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-nombre" className={lbl}>Nombre completo</Label>
                <Input id="edit-nombre" {...register('nombre')} aria-invalid={!!errors.nombre} />
                {errors.nombre && <p className="text-[12.5px] text-meyah-terracota-700">{errors.nombre.message}</p>}
              </div>

              {/* Profesion */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-profesion" className={lbl}>
                  {esCand ? 'Profesión u oficio' : 'Cargo'}
                </Label>
                <Input id="edit-profesion" placeholder={esCand ? 'Ej: Auxiliar contable' : 'Ej: Gerente de RH'} {...register('profesion')} />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-phone" className={lbl}>Teléfono</Label>
                <Input id="edit-phone" type="tel" inputMode="tel" placeholder="999 000 0000" {...register('phone')} aria-invalid={!!errors.phone} />
                {errors.phone && <p className="text-[12.5px] text-meyah-terracota-700">{errors.phone.message}</p>}
              </div>

              {/* Email (disabled) */}
              <div className="flex flex-col gap-1.5">
                <Label className={lbl}>Correo electrónico</Label>
                <input className={`${field} cursor-not-allowed bg-meyah-crema-100 text-meyah-tinta-400`} value={email ?? ''} disabled />
                <span className="text-[11.5px] text-meyah-tinta-400">El correo se gestiona desde la configuración de cuenta.</span>
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-bio" className={lbl}>Biografía</Label>
                <textarea id="edit-bio" className={`${field} min-h-24 resize-none`} maxLength={240} {...register('bio')} />
                <span className="text-right text-[11.5px] text-meyah-tinta-400">{bio.length}/240</span>
              </div>

              {/* Location */}
              <div className="rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-meyah-jade-600" />
                  <span className={lbl}>Ubicación de referencia</span>
                </div>
                {tieneUbicacion ? (
                  <>
                    <div className="h-48 overflow-hidden rounded-card border border-meyah-border-soft">
                      <LocationPicker
                        lat={lat}
                        lng={lng}
                        onChange={(la, ln) => {
                          setValue('lat_referencia', la, { shouldDirty: true })
                          setValue('lng_referencia', ln, { shouldDirty: true })
                        }}
                      />
                    </div>
                    <p className="mt-2 text-[12px] text-meyah-tinta-400">Arrastra el punto para cambiar tu zona.</p>
                    <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => {
                      setValue('lat_referencia', null, { shouldValidate: true })
                      setValue('lng_referencia', null, { shouldValidate: true })
                    }}>
                      Quitar ubicación
                    </Button>
                  </>
                ) : (
                  <Button type="button" size="sm" onClick={() => {
                    setValue('lat_referencia', MERIDA_CENTER[0], { shouldValidate: true })
                    setValue('lng_referencia', MERIDA_CENTER[1], { shouldValidate: true })
                  }}>
                    <MapPin size={15} /> Agregar ubicación
                  </Button>
                )}
              </div>

              {/* Radio slider (candidato only) */}
              {esCand && tieneUbicacion && (
                <div className="rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-radio" className={lbl}>Radio de búsqueda</Label>
                    <span className="rounded-full bg-meyah-jade-50 px-2.5 py-0.5 text-[13px] font-bold text-meyah-jade-700">
                      {radio ?? 20} km
                    </span>
                  </div>
                  <input id="edit-radio" type="range" min={1} max={20} step={1} value={radio ?? 20}
                    onChange={e => setValue('radio_busqueda_km', Number(e.target.value), { shouldDirty: true })}
                    className="mt-3 w-full accent-meyah-jade-700" />
                  <p className="mt-1.5 text-[12px] text-meyah-tinta-400">Solo verás vacantes dentro de esta distancia.</p>
                </div>
              )}

              {/* Searchable (candidato) */}
              {esCand && (
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input type="checkbox" {...register('is_searchable')} className="h-4.5 w-4.5 flex-none accent-meyah-jade-500" />
                  <span className="text-[13.5px] text-meyah-tinta-600">Quiero aparecer en búsquedas de empleadores cercanos</span>
                </label>
              )}

              {/* Email opt-out */}
              <div className="rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-4">
                <div className="flex items-start gap-3">
                  <BellOff size={18} className="mt-0.5 flex-none text-meyah-tinta-400" />
                  <div>
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input type="checkbox" {...register('email_opt_out')} className="h-4.5 w-4.5 flex-none accent-meyah-terracota-500" />
                      <span className="text-[13.5px] font-medium text-meyah-tinta-900">No quiero recibir notificaciones por correo</span>
                    </label>
                    <p className="mt-1.5 text-[12px] text-meyah-tinta-400">
                      Si desactivas las notificaciones, no recibirás avisos de postulaciones ni cambios de estado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 border-t border-meyah-border-soft bg-white px-6 py-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
