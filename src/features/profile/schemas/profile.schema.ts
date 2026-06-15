import { z } from 'zod'

export const profileSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, 'El nombre es obligatorio')
      .max(80, 'Máximo 80 caracteres'),
    // B8: la columna profiles.phone es nullable. El teléfono es OPCIONAL aquí:
    // un usuario que se registró sin teléfono debe poder guardar otros cambios
    // de perfil sin inventar uno. Si SÍ se provee, debe ser válido (≥10 dígitos).
    phone: z
      .string()
      .trim()
      .max(20, 'Máximo 20 caracteres')
      .refine(
        v => v === '' || (/^\+?[\d\s()-]+$/.test(v) && v.replace(/\D/g, '').length >= 10),
        'Ingresa un teléfono válido de 10 dígitos o déjalo vacío.',
      ),
    profesion: z.string().trim().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
    bio: z.string().trim().max(240, 'Máximo 240 caracteres').optional().or(z.literal('')),
    lat_referencia: z.number().min(-90).max(90).nullable(),
    lng_referencia: z.number().min(-180).max(180).nullable(),
    // Mismo rango que el registro (y que el CHECK profiles_radio_busqueda_km)
    radio_busqueda_km: z.number().int().min(1).max(20).nullable(),
    is_searchable: z.boolean(),
    email_opt_out: z.boolean(),
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
