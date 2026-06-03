import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { jobSchema, type JobFormValues } from '@/features/jobs/schemas/jobSchema'
import { JOB_CATEGORIES } from '@/features/jobs/schemas/categories'
import type { Job } from '@/shared/types'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import LocationPicker from '@/features/jobs/components/LocationPicker'

interface JobFormProps {
  job?: Job
  onSubmit: (values: JobFormValues) => void
  isSubmitting?: boolean
}

export default function JobForm({ job, onSubmit, isSubmitting = false }: JobFormProps) {
  // Tercer genérico (JobFormValues) necesario porque jobSchema usa z.coerce.number(),
  // creando diferencia input/output. handleSubmit entregará el output ya transformado.
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof jobSchema>, unknown, JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      titulo:      job?.titulo      ?? '',
      descripcion: job?.descripcion ?? '',
      // job.categoria viene como string genérico desde la BD; el cast es seguro
      // porque al crear la vacante Zod garantizó que es uno de los values válidos.
      categoria:   (job?.categoria ?? 'ventas') as JobFormValues['categoria'],
      salario_min: job?.salario_min ?? 0,
      salario_max: job?.salario_max ?? 0,
      lat:         job?.lat         ?? 20.97,  // centro de Mérida por defecto
      lng:         job?.lng         ?? -89.62,
    },
  })

  // lat y lng no vienen de inputs de texto — se sincronizan desde el mapa
  const lat = watch('lat')
  const lng = watch('lng')

  const selectClass = cn(
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1',
    'text-base shadow-xs outline-none transition-[color,box-shadow]',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

      {/* ── Título ─────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="titulo" className="text-sm font-medium">
          Título de la vacante
        </Label>
        <Input
          id="titulo"
          type="text"
          placeholder="Ej: Gerente de tienda en Altabrisa"
          aria-invalid={!!errors.titulo}
          {...register('titulo')}
        />
        {errors.titulo && (
          <p className="text-sm text-destructive">{errors.titulo.message}</p>
        )}
      </div>

      {/* ── Categoría ──────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="categoria" className="text-sm font-medium">
          Categoría
        </Label>
        <select
          id="categoria"
          aria-invalid={!!errors.categoria}
          className={selectClass}
          {...register('categoria')}
        >
          {JOB_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.categoria && (
          <p className="text-sm text-destructive">{errors.categoria.message}</p>
        )}
      </div>

      {/* ── Salarios ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="salario_min" className="text-sm font-medium">
            Salario mínimo (MXN)
          </Label>
          <Input
            id="salario_min"
            type="number"
            min={0}
            aria-invalid={!!errors.salario_min}
            {...register('salario_min')}
          />
          {errors.salario_min && (
            <p className="text-sm text-destructive">{errors.salario_min.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salario_max" className="text-sm font-medium">
            Salario máximo (MXN)
          </Label>
          <Input
            id="salario_max"
            type="number"
            min={0}
            aria-invalid={!!errors.salario_max}
            {...register('salario_max')}
          />
          {errors.salario_max && (
            <p className="text-sm text-destructive">{errors.salario_max.message}</p>
          )}
        </div>
      </div>

      {/* ── Descripción ────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </Label>
        <Textarea
          id="descripcion"
          rows={5}
          placeholder="Describe el puesto, responsabilidades, horario y requisitos."
          aria-invalid={!!errors.descripcion}
          {...register('descripcion')}
        />
        {errors.descripcion && (
          <p className="text-sm text-destructive">{errors.descripcion.message}</p>
        )}
      </div>

      {/* ── Ubicación (mapa) ───────────────────────────────── */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Ubicación de la vacante
        </Label>
        <p className="text-xs text-muted-foreground">
          Haz clic en el mapa o arrastra el pin para marcar dónde está el empleo.
        </p>
        <LocationPicker
          lat={lat as number}
          lng={lng as number}
          onChange={(newLat, newLng) => {
            setValue('lat', newLat, { shouldValidate: true })
            setValue('lng', newLng, { shouldValidate: true })
          }}
        />
        {(errors.lat ?? errors.lng) && (
          <p className="text-sm text-destructive">Selecciona una ubicación válida en el mapa.</p>
        )}
      </div>

      {/* ── Submit ─────────────────────────────────────────── */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Guardando...
          </>
        ) : (
          job ? 'Guardar cambios' : 'Publicar vacante'
        )}
      </Button>

    </form>
  )
}
