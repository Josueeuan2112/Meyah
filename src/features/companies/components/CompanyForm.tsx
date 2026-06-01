import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Loader2 } from 'lucide-react'

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

  return (
    <form
      // TTransformedValues=CompanyFormValues en useForm garantiza que handleSubmit
      // entrega valores ya transformados por Zod (sitio_web '' → undefined). Sin cast.
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
    >

      {/* ── Nombre ─────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="nombre" className="text-sm font-medium">
          Nombre de la empresa
        </Label>
        <Input
          id="nombre"
          type="text"
          placeholder="Ej: Tortillería La Yucateca"
          aria-invalid={!!errors.nombre}
          {...register('nombre')}
        />
        {errors.nombre && (
          <p className="text-sm text-destructive">{errors.nombre.message}</p>
        )}
      </div>

      {/* ── Descripción ────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="descripcion" className="text-sm font-medium">
          Descripción
        </Label>
        <Textarea
          id="descripcion"
          rows={4}
          placeholder="¿A qué se dedica la empresa? ¿Cuál es su historia y cultura?"
          aria-invalid={!!errors.descripcion}
          {...register('descripcion')}
        />
        {errors.descripcion && (
          <p className="text-sm text-destructive">{errors.descripcion.message}</p>
        )}
      </div>

      {/* ── Dirección ──────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="direccion" className="text-sm font-medium">
          Dirección
        </Label>
        <Input
          id="direccion"
          type="text"
          placeholder="Ej: Calle 60 #123, Col. Centro, Mérida"
          aria-invalid={!!errors.direccion}
          {...register('direccion')}
        />
        {errors.direccion && (
          <p className="text-sm text-destructive">{errors.direccion.message}</p>
        )}
      </div>

      {/* ── Sitio web (esto es opcional)───────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="sitio_web" className="text-sm font-medium">
          Sitio web <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="sitio_web"
          type="url"
          placeholder="https://miempresa.com"
          aria-invalid={!!errors.sitio_web}
          {...register('sitio_web')}
        />
        {errors.sitio_web && (
          <p className="text-sm text-destructive">{errors.sitio_web.message}</p>
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
          company ? 'Guardar cambios' : 'Crear empresa'
        )}
      </Button>

    </form>
  )
}
