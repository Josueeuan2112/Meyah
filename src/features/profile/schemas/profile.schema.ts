import { z } from 'zod'

export const profileSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, 'El nombre es obligatorio')
      .max(80, 'Máximo 80 caracteres'),
    phone: z
      .string()
      .trim()
      .min(10, 'Ingresa un teléfono de 10 dígitos.')
      .max(20, 'Máximo 20 caracteres'),
    lat_referencia: z.number().min(-90).max(90).nullable(),
    lng_referencia: z.number().min(-180).max(180).nullable(),
    is_searchable: z.boolean(),
  })
  .refine(
    d => (d.lat_referencia === null) === (d.lng_referencia === null),
    {
      message: 'La ubicación necesita latitud y longitud juntas',
      path: ['lat_referencia'],
    }
  )

export type ProfileSchemaInput = z.input<typeof profileSchema>
export type ProfileSchemaOutput = z.output<typeof profileSchema>
