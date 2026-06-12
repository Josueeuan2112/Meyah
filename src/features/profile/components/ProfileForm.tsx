import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin } from 'lucide-react'

import LocationPicker from '@/features/jobs/components/LocationPicker'
import { profileSchema } from '@/features/profile/schemas/profile.schema'
import type { ProfileSchemaInput, ProfileSchemaOutput } from '@/features/profile/schemas/profile.schema'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

const MERIDA_CENTER: [number, number] = [20.9674, -89.5926]

interface ProfileFormProps {
  defaultValues: ProfileSchemaInput
  onSubmit: (values: ProfileSchemaOutput) => void | Promise<void>
  isSubmitting: boolean
  roleLabel?: string
}

export default function ProfileForm({ defaultValues, onSubmit, isSubmitting, roleLabel }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileSchemaInput, unknown, ProfileSchemaOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  const nombre = watch('nombre')
  const lat = watch('lat_referencia')
  const lng = watch('lng_referencia')
  const radio = watch('radio_busqueda_km')
  const tieneUbicacion = lat !== null && lng !== null

  const nombreTrim = nombre.trim()
  const iniciales = nombreTrim
    ? nombreTrim.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?'

  const agregarUbicacion = () => {
    setValue('lat_referencia', MERIDA_CENTER[0], { shouldValidate: true })
    setValue('lng_referencia', MERIDA_CENTER[1], { shouldValidate: true })
  }

  const quitarUbicacion = () => {
    setValue('lat_referencia', null, { shouldValidate: true })
    setValue('lng_referencia', null, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="mt-8.5 grid items-start gap-5 md:grid-cols-2">

        {/* Tarjeta izquierda: datos */}
        <div className="rounded-panel border border-meyah-border-soft bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3.75">
            <div className="grid h-14 w-14 flex-none place-items-center rounded-full bg-meyah-jade-500 font-display text-[20px] font-semibold text-white">
              {iniciales}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[20px]">{nombre || 'Tu nombre'}</h3>
              {roleLabel && <p className="mt-0.5 text-[13.5px] text-meyah-tinta-600">{roleLabel}</p>}
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre" className="text-[13.5px] font-semibold text-meyah-tinta-900">Nombre completo</Label>
              <Input id="nombre" {...register('nombre')} aria-invalid={!!errors.nombre} />
              {errors.nombre && <p className="text-[12.5px] text-meyah-terracota-700">{errors.nombre.message}</p>}
            </div>
            {/* Teléfono (opcional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                Teléfono
              </Label>
              <Input id="phone" type="tel" inputMode="tel" placeholder="999 000 0000" {...register('phone')} aria-invalid={!!errors.phone} />
              {errors.phone && <p className="text-[12.5px] text-meyah-terracota-700">{errors.phone.message}</p>}
            </div>
            {/* Aparecer en búsquedas (is_searchable) — solo candidato */}
            {roleLabel === 'Candidato' && (
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" {...register('is_searchable')} className="h-4.5 w-4.5 flex-none accent-meyah-jade-500" />
                <span className="text-[13.5px] text-meyah-tinta-600">Quiero aparecer en búsquedas de empleadores cercanos</span>
              </label>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>

        {/* Tarjeta derecha: mapa */}
        <div className="rounded-panel border border-meyah-border-soft bg-white p-5.5 shadow-sm md:sticky md:top-24">
          <span className="eyebrow">Ubicación de referencia</span>
          <h4 className="mt-1 font-display text-[22px] text-meyah-jade-900">
            {tieneUbicacion ? 'Tu zona en Mérida' : 'Sin ubicación'}
          </h4>

          {lat !== null && lng !== null ? (
            <>
              <div className="my-4 h-70 overflow-hidden rounded-card border border-meyah-border-soft">
                <LocationPicker
                  lat={lat}
                  lng={lng}
                  onChange={(la, ln) => {
                    setValue('lat_referencia', la, { shouldDirty: true })
                    setValue('lng_referencia', ln, { shouldDirty: true })
                  }}
                />
              </div>
              <p className="flex items-center gap-1.5 text-[13px] text-meyah-tinta-400">
                <MapPin size={14} className="text-meyah-jade-600" /> Arrastra el punto para cambiar tu zona.
              </p>

              {/* Radio de búsqueda — solo candidato: filtra qué tan lejos ve vacantes */}
              {roleLabel === 'Candidato' && (
                <div className="mt-4 rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="radio" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                      Radio de búsqueda
                    </Label>
                    <span className="rounded-full bg-meyah-jade-50 px-2.5 py-0.5 text-[13px] font-bold text-meyah-jade-700">
                      {radio != null ? `${radio} km` : 'Sin límite'}
                    </span>
                  </div>
                  <input
                    id="radio"
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={radio ?? 20}
                    onChange={e => setValue('radio_busqueda_km', Number(e.target.value), { shouldDirty: true })}
                    className="mt-3 w-full accent-meyah-jade-700"
                  />
                  <p className="mt-1.5 text-[12px] text-meyah-tinta-400">
                    Solo verás vacantes dentro de esta distancia de tu casa.
                  </p>
                </div>
              )}

              <Button type="button" variant="ghost" size="sm" onClick={quitarUbicacion}>
                Quitar ubicación
              </Button>
            </>
          ) : (
            <div className="my-4 grid h-70 place-items-center rounded-card border border-dashed border-meyah-border bg-meyah-crema-50 text-center">
              <div className="flex flex-col items-center gap-3 px-6">
                <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-meyah-crema-100 text-meyah-tinta-400">
                  <MapPin size={22} />
                </div>
                <p className="text-[13.5px] text-meyah-tinta-600">
                  Agrega tu ubicación para ordenar las vacantes por cercanía
                </p>
                <Button type="button" onClick={agregarUbicacion}>Agregar ubicación</Button>
              </div>
            </div>
          )}

          {errors.lat_referencia && (
            <p className="mt-2 text-[12.5px] text-meyah-terracota-700">{errors.lat_referencia.message}</p>
          )}
        </div>
      </div>
    </form>
  )
}
