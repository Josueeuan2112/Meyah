import { z } from 'zod'

export const registerSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre no puede exceder 80 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  phone: z
    .string()
    .trim()
    .min(10, 'Ingresa un teléfono de 10 dígitos.')
    .max(20, 'Máximo 20 caracteres'),
  tipo: z.enum(['empleador', 'candidato'], {
    error: 'Selecciona si eres empleador o candidato',
  }),
  lat_referencia: z.number().min(-90).max(90).nullable().optional(),
  lng_referencia: z.number().min(-180).max(180).nullable().optional(),
})

export type RegisterFormData = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export type LoginFormData = z.infer<typeof loginSchema>
