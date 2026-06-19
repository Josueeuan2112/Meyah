import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { z } from 'zod'

import { companySchema, type CompanyFormValues } from '@/features/companies/schemas/companySchema'
import LocationPicker from '@/features/jobs/components/LocationPicker'
import { geocodeAddress } from '@/shared/lib/geocode'
import type { Company } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { MERIDA_CENTER } from '@/shared/lib/geo'

interface CompanyFormProps {
  company?: Company
  onSubmit: (values: CompanyFormValues) => void
  isSubmitting?: boolean
}

export default function CompanyForm({ company, onSubmit, isSubmitting = false }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.input<typeof companySchema>, unknown, CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nombre:      company?.nombre      ?? '',
      descripcion: company?.descripcion ?? '',
      direccion:   company?.direccion   ?? '',
      sitio_web:   company?.sitio_web   ?? '',  // siempre string en el form, nunca undefined
      lat:         company?.lat         ?? MERIDA_CENTER[0],
      lng:         company?.lng         ?? MERIDA_CENTER[1],
    },
  })

  const nombre = watch('nombre')
  const direccion = watch('direccion')
  const lat = watch('lat') ?? MERIDA_CENTER[0]
  const lng = watch('lng') ?? MERIDA_CENTER[1]

  const [geocoding, setGeocoding] = useState(false)

  // Geocodifica la dirección escrita y mueve el pin. Reutiliza la util de
  // Nominatim (1 req/seg) que ya usa el registro del candidato: solo se llama
  // al pulsar el botón, nunca por tecla. Con BUG 1 corregido, el mapa recentra.
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
        setValue('lat', result.lat, { shouldValidate: true })
        setValue('lng', result.lng, { shouldValidate: true })
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
              <button
                type="button"
                onClick={() => void handleLocate()}
                disabled={geocoding}
                className="inline-flex w-fit items-center gap-1.5 rounded-field bg-meyah-terracota-50 px-3 py-2 text-[12.5px] font-semibold text-meyah-terracota-700 transition hover:bg-meyah-terracota-100 disabled:opacity-60"
              >
                {geocoding ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                Ubicar en el mapa
              </button>
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

          <div className="mt-4 h-70 overflow-hidden rounded-card border border-meyah-border-soft">
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setValue('lat', newLat, { shouldValidate: true })
                setValue('lng', newLng, { shouldValidate: true })
              }}
            />
          </div>
          <p className="mt-2.5 text-[12.5px] text-meyah-tinta-400">
            Arrastra el pin o toca el mapa. Esta ubicación se usará como punto de partida al publicar vacantes.
          </p>
        </div>
      </div>
    </form>
  )
}
