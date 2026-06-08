import { z } from 'zod'

export const applicationSchema = z.object({
  mensaje: z
    .string()
    .trim()
    .max(1000, 'Máximo 1000 caracteres')
    .optional()
    .transform(val => (val === undefined || val === '' ? null : val)),
})

export type ApplicationSchemaInput = z.input<typeof applicationSchema>
export type ApplicationSchemaOutput = z.output<typeof applicationSchema>
