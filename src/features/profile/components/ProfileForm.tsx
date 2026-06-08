import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
}

export default function ProfileForm({ defaultValues, onSubmit, isSubmitting }: ProfileFormProps) {
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

  const lat = watch('lat_referencia')
  const lng = watch('lng_referencia')

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

      {/* nombre */}
      <div>
        <Label htmlFor="nombre" className="text-sm font-medium text-meyah-tinta-900">
          Nombre completo
        </Label>
        <Input
          id="nombre"
          type="text"
          className="mt-1"
          aria-invalid={!!errors.nombre}
          {...register('nombre')}
        />
        {errors.nombre && (
          <p className="text-xs text-meyah-terracota-700 mt-1">{errors.nombre.message}</p>
        )}
      </div>

      {/* phone */}
      <div>
        <Label htmlFor="phone" className="text-sm font-medium text-meyah-tinta-900">
          Teléfono (opcional)
        </Label>
        <Input
          id="phone"
          type="tel"
          className="mt-1"
          aria-invalid={!!errors.phone}
          {...register('phone')}
        />
        {errors.phone && (
          <p className="text-xs text-meyah-terracota-700 mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* ubicación de referencia */}
      <div>
        <p className="text-sm font-medium text-meyah-tinta-900 mb-3">
          Ubicación de referencia
        </p>
        {lat !== null && lng !== null ? (
          <div className="space-y-3">
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(la, ln) => {
                setValue('lat_referencia', la, { shouldValidate: true })
                setValue('lng_referencia', ln, { shouldValidate: true })
              }}
            />
            <button
              type="button"
              onClick={() => {
                setValue('lat_referencia', null, { shouldValidate: true })
                setValue('lng_referencia', null, { shouldValidate: true })
              }}
              className="text-sm text-meyah-terracota-700 hover:underline"
            >
              Quitar ubicación
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setValue('lat_referencia', MERIDA_CENTER[0], { shouldValidate: true })
              setValue('lng_referencia', MERIDA_CENTER[1], { shouldValidate: true })
            }}
            className="text-sm text-meyah-jade-700 border border-meyah-jade-500/30 rounded-lg px-4 py-2 hover:bg-meyah-jade-50 transition-colors"
          >
            Agregar mi ubicación de referencia
          </button>
        )}
        {errors.lat_referencia && (
          <p className="text-xs text-meyah-terracota-700 mt-2">{errors.lat_referencia.message}</p>
        )}
      </div>

      {/* is_searchable */}
      <div className="flex items-center gap-3">
        <input
          id="is_searchable"
          type="checkbox"
          className="h-4 w-4 rounded accent-meyah-jade-500"
          {...register('is_searchable')}
        />
        <Label htmlFor="is_searchable" className="text-sm text-meyah-tinta-900 cursor-pointer">
          Quiero aparecer en búsquedas de empleadores
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto bg-meyah-jade-500 hover:bg-meyah-jade-700 text-white"
      >
        {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
      </Button>

    </form>
  )
}
