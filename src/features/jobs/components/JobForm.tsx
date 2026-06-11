import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'

import { jobSchema, type JobFormValues } from '@/features/jobs/schemas/jobSchema'
import { ICON_BY_CATEGORY, JOB_CATEGORIES, JOB_SCHEDULES } from '@/features/jobs/schemas/categories'
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
  const navigate = useNavigate()
  const isEdit = !!job

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
      // job.categoria/jornada vienen como string genérico desde la BD; el cast es seguro
      // porque al crear la vacante Zod garantizó que son uno de los values válidos.
      categoria:   (job?.categoria ?? 'ventas') as JobFormValues['categoria'],
      jornada:     (job?.jornada ?? 'tiempo_completo') as JobFormValues['jornada'],
      salario_min: job?.salario_min ?? 0,
      salario_max: job?.salario_max ?? 0,
      lat:         job?.lat         ?? 20.97,  // centro de Mérida por defecto
      lng:         job?.lng         ?? -89.62,
    },
  })

  // lat y lng no vienen de inputs de texto — se sincronizan desde el mapa
  const lat = watch('lat')
  const lng = watch('lng')
  const categoria = watch('categoria')
  const jornada = watch('jornada')

  const chipBase = 'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition border'

  return (
    <div className="mx-auto max-w-275 px-4 py-8 sm:px-6">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>

        {/* Header */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[14px] text-meyah-tinta-600 hover:text-meyah-jade-900"
        >
          <ArrowLeft size={16} /> Volver a vacantes
        </button>
        <span className="eyebrow mt-4 block">{isEdit ? 'Editar vacante' : 'Nueva vacante'}</span>
        <h1 className="mt-1 text-[clamp(30px,4vw,42px)]">{isEdit ? 'Edita la vacante' : 'Publica una vacante'}</h1>
        <p className="mt-2 text-[15.5px] text-meyah-tinta-600">
          Aparecerá en el mapa para candidatos cerca de tu ubicación.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mt-7 grid items-start gap-5 md:grid-cols-2">

            {/* Tarjeta izquierda: datos */}
            <div className="rounded-panel border border-meyah-border-soft bg-white p-7 shadow-sm">
              <div className="flex flex-col gap-5">

                {/* Título */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="titulo" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                    Título de la vacante
                  </Label>
                  <Input
                    id="titulo"
                    type="text"
                    placeholder="Ej. Barista de especialidad"
                    aria-invalid={!!errors.titulo}
                    {...register('titulo')}
                  />
                  {errors.titulo && (
                    <p className="text-[12.5px] text-meyah-terracota-700">{errors.titulo.message}</p>
                  )}
                </div>

                {/* Categoría */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[13.5px] font-semibold text-meyah-tinta-900">Categoría</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {JOB_CATEGORIES.map(c => {
                      const Icon = ICON_BY_CATEGORY[c.value]
                      const active = categoria === c.value
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setValue('categoria', c.value, { shouldValidate: true })}
                          className={cn(
                            chipBase,
                            active
                              ? 'border-meyah-jade-900 bg-meyah-jade-900 text-white'
                              : 'border-meyah-border bg-white text-meyah-tinta-700 hover:border-meyah-jade-500/40'
                          )}
                        >
                          <Icon size={15} /> {c.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.categoria && (
                    <p className="text-[12.5px] text-meyah-terracota-700">{errors.categoria.message}</p>
                  )}
                </div>

                {/* Sueldos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="salario_min" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                      Sueldo mínimo <span className="font-normal text-meyah-tinta-400">MXN / mes</span>
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-meyah-tinta-400">$</span>
                      <Input
                        id="salario_min"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="pl-7"
                        aria-invalid={!!errors.salario_min}
                        {...register('salario_min')}
                      />
                    </div>
                    {errors.salario_min && (
                      <p className="text-[12.5px] text-meyah-terracota-700">{errors.salario_min.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="salario_max" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                      Sueldo máximo <span className="font-normal text-meyah-tinta-400">MXN / mes</span>
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-meyah-tinta-400">$</span>
                      <Input
                        id="salario_max"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="pl-7"
                        aria-invalid={!!errors.salario_max}
                        {...register('salario_max')}
                      />
                    </div>
                    {errors.salario_max && (
                      <p className="text-[12.5px] text-meyah-terracota-700">{errors.salario_max.message}</p>
                    )}
                  </div>
                </div>

                {/* Tipo de jornada */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[13.5px] font-semibold text-meyah-tinta-900">Tipo de jornada</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {JOB_SCHEDULES.map(s => {
                      const active = jornada === s.value
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setValue('jornada', s.value, { shouldValidate: true })}
                          className={cn(
                            chipBase,
                            active
                              ? 'border-meyah-jade-500 bg-meyah-jade-50 text-meyah-jade-900'
                              : 'border-meyah-border bg-white text-meyah-tinta-700'
                          )}
                        >
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.jornada && (
                    <p className="text-[12.5px] text-meyah-terracota-700">{errors.jornada.message}</p>
                  )}
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="descripcion" className="text-[13.5px] font-semibold text-meyah-tinta-900">
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
                    <p className="text-[12.5px] text-meyah-terracota-700">{errors.descripcion.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tarjeta derecha: mapa + acción */}
            <div className="rounded-panel border border-meyah-border-soft bg-white p-5.5 shadow-sm md:sticky md:top-24">
              <span className="eyebrow">Ubicación</span>
              <h3 className="mt-1 font-display text-[24px] text-meyah-jade-900">¿Dónde está el empleo?</h3>
              <p className="mt-1 text-[14px] text-meyah-tinta-600">Arrastra el punto para marcar el lugar exacto.</p>

              <div className="my-4 h-75 overflow-hidden rounded-card border border-meyah-border-soft">
                <LocationPicker
                  lat={lat as number}
                  lng={lng as number}
                  onChange={(newLat, newLng) => {
                    setValue('lat', newLat, { shouldValidate: true })
                    setValue('lng', newLng, { shouldValidate: true })
                  }}
                />
              </div>
              {(errors.lat ?? errors.lng) && (
                <p className="mb-3 text-[12.5px] text-meyah-terracota-700">
                  Selecciona una ubicación válida en el mapa.
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Publicar vacante')} <ArrowRight />
              </Button>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
