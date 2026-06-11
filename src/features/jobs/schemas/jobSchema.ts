import { z } from 'zod'

import { JOB_CATEGORY_VALUES, JOB_SCHEDULE_VALUES } from '@/features/jobs/schemas/categories'

export const jobSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(5, 'El título debe tener al menos 5 caracteres.')
      .max(120),

    descripcion: z
      .string()
      .trim()
      .min(30, 'La descripción debe tener al menos 30 caracteres.')
      .max(2000),

    // { error } en lugar de { message } — API de Zod v4 para enum
    categoria: z.enum(JOB_CATEGORY_VALUES, { error: 'Selecciona una categoría.' }),

    jornada: z.enum(JOB_SCHEDULE_VALUES, { error: 'Selecciona un tipo de jornada.' }).default('tiempo_completo'),

    // z.coerce.number() convierte el string del input HTML a number antes de validar
    salario_min: z.coerce
      .number()
      .int('El salario mínimo debe ser un número válido.')
      .min(0, 'El salario mínimo debe ser un número válido.'),

    salario_max: z.coerce
      .number()
      .int('El salario máximo debe ser un número válido.')
      .min(0, 'El salario máximo debe ser un número válido.'),

    // Coordenadas geográficas — rango aproximado de México
    lat: z.coerce.number().min(14, 'Ubicación inválida.').max(33, 'Ubicación inválida.'),
    lng: z.coerce.number().min(-119, 'Ubicación inválida.').max(-86, 'Ubicación inválida.'),
  })
  .superRefine((data, ctx) => {
    if (data.salario_max < data.salario_min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El salario máximo no puede ser menor que el mínimo.',
        path: ['salario_max'],
      })
    }
  })

// z.infer devuelve el OUTPUT del schema (después de coerce):
// todos los campos numéricos son number, no string.
export type JobFormValues = z.infer<typeof jobSchema>
