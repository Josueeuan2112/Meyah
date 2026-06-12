import { z } from 'zod'

import { JOB_CATEGORY_VALUES, JOB_SCHEDULE_VALUES } from '@/features/jobs/schemas/categories'

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
    .max(20, 'Máximo 20 caracteres')
    // Solo dígitos y separadores comunes: sin esto "aaaaaaaaaa" pasaba y el
    // empleador recibía un teléfono incontactable
    .regex(/^\+?[\d\s()-]+$/, 'El teléfono solo puede tener números, espacios y guiones.'),
  tipo: z.enum(['empleador', 'candidato'], {
    error: 'Selecciona si eres empleador o candidato',
  }),
  lat_referencia: z.number().min(-90).max(90).nullable().optional(),
  lng_referencia: z.number().min(-180).max(180).nullable().optional(),
  // Preferencias del paso "Tu zona" / "Tu perfil" (solo candidato, opcionales:
  // mejor permitir avanzar que forzar el abandono del registro)
  radio_busqueda_km: z.number().int().min(1).max(20).nullable().optional(),
  categorias_interes: z.array(z.enum(JOB_CATEGORY_VALUES)).nullable().optional(),
  disponibilidad: z.enum(JOB_SCHEDULE_VALUES).nullable().optional(),
})

export type RegisterFormData = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// Mismo mínimo que registerSchema.password — y que el "minimum password length"
// configurado en Supabase Auth: cliente y servidor deben pedir lo mismo.
export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
