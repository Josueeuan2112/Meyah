import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { MapPin } from 'lucide-react'

import { companySchema, type CompanyFormValues } from '@/features/companies/schemas/companySchema'
import type { Company } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'

interface CompanyFormProps {
  company?: Company
  onSubmit: (values: CompanyFormValues) => void
  isSubmitting?: boolean
}

export default function CompanyForm({ company, onSubmit, isSubmitting = false }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof companySchema>, unknown, CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nombre:      company?.nombre      ?? '',
      descripcion: company?.descripcion ?? '',
      direccion:   company?.direccion   ?? '',
      sitio_web:   company?.sitio_web   ?? '',  // siempre string en el form, nunca undefined
    },
  })

  const nombre = watch('nombre')
  const direccion = watch('direccion')

  const nombreTrim = nombre.trim()
  const iniciales = nombreTrim
    ? nombreTrim.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?'

  return (
    <form
      // TTransformedValues=CompanyFormValues en useForm garantiza que handleSubmit
      // entrega valores ya transformados por Zod (sitio_web '' → undefined). Sin cast.
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="mt-8.5 grid items-start gap-5 md:grid-cols-2">

        {/* Tarjeta izquierda: datos */}
        <div className="rounded-panel border border-meyah-border-soft bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-3.75">
            <div className="grid h-14 w-14 flex-none place-items-center rounded-[16px] bg-meyah-terracota-500 font-display text-[20px] font-semibold text-white">
              {iniciales}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[20px]">{nombre || 'Tu empresa'}</h3>
              <p className="mt-0.5 text-[13.5px] text-meyah-tinta-600">Mérida, Yucatán</p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre" className="text-[13.5px] font-semibold text-meyah-tinta-900">Nombre de la empresa</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Ej: Tortillería La Yucateca"
                aria-invalid={!!errors.nombre}
                {...register('nombre')}
              />
              {errors.nombre && <p className="text-[12.5px] text-meyah-terracota-700">{errors.nombre.message}</p>}
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descripcion" className="text-[13.5px] font-semibold text-meyah-tinta-900">Descripción</Label>
              <Textarea
                id="descripcion"
                rows={4}
                placeholder="¿A qué se dedica la empresa? ¿Cuál es su historia y cultura?"
                aria-invalid={!!errors.descripcion}
                {...register('descripcion')}
              />
              {errors.descripcion && <p className="text-[12.5px] text-meyah-terracota-700">{errors.descripcion.message}</p>}
            </div>

            {/* Dirección */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="direccion" className="text-[13.5px] font-semibold text-meyah-tinta-900">Dirección</Label>
              <Input
                id="direccion"
                type="text"
                placeholder="Ej: Calle 60 #123, Col. Centro, Mérida"
                aria-invalid={!!errors.direccion}
                {...register('direccion')}
              />
              {errors.direccion && <p className="text-[12.5px] text-meyah-terracota-700">{errors.direccion.message}</p>}
            </div>

            {/* Sitio web (opcional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sitio_web" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                Sitio web <span className="font-normal text-meyah-tinta-400">(opcional)</span>
              </Label>
              <Input
                id="sitio_web"
                type="url"
                placeholder="https://miempresa.com"
                aria-invalid={!!errors.sitio_web}
                {...register('sitio_web')}
              />
              {errors.sitio_web && <p className="text-[12.5px] text-meyah-terracota-700">{errors.sitio_web.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : company ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </div>

        {/* Tarjeta derecha: ubicación */}
        <div className="rounded-panel border border-meyah-border-soft bg-white p-5.5 shadow-sm md:sticky md:top-24">
          <span className="eyebrow">Ubicación de tu negocio</span>
          <h4 className="mt-1 font-display text-[22px] text-meyah-jade-900">Tu negocio en el mapa</h4>
          <p className="mt-1 text-[14px] text-meyah-tinta-600">Define dónde estás para conectar con gente cercana.</p>

          <div className="mt-4 grid h-70 place-items-center overflow-hidden rounded-card border border-meyah-border-soft bg-meyah-crema-50 text-center">
            <div className="flex flex-col items-center gap-3 px-6">
              <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-meyah-crema-100 text-meyah-tinta-400">
                <MapPin size={22} />
              </div>
              <p className="text-[13.5px] text-meyah-tinta-600">
                {direccion || 'Agrega la dirección de tu negocio'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
