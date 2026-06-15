import { z } from 'zod'

// Longitud máxima del comentario, compartida entre el schema y el contador de la
// UI para que ambos digan lo mismo.
export const MAX_COMMENT_LENGTH = 300

export const reviewSchema = z.object({
  // Calificación obligatoria de 1 a 5 estrellas. El default es 0 (sin elegir),
  // que falla el min(1) y bloquea el envío.
  rating: z
    .number()
    .int()
    .min(1, 'Selecciona una calificación')
    .max(5, 'La calificación máxima es 5'),
  comment: z
    .string()
    .trim()
    .max(MAX_COMMENT_LENGTH, `Máximo ${MAX_COMMENT_LENGTH} caracteres`)
    .optional(),
})

export type ReviewFormData = z.infer<typeof reviewSchema>
