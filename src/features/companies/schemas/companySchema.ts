import { z } from 'zod'

export const companySchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre de la empresa es obligatorio.')
    .max(120),

  descripcion: z
    .string()
    .trim()
    .min(20, 'La descripción debe tener al menos 20 caracteres.')
    .max(1000),

  direccion: z
    .string()
    .trim()
    .min(5, 'La dirección es obligatoria.')
    .max(200),

  // transform + pipe: el trim convierte "  " en "", luego transform convierte ""
  // en undefined antes de que z.string().url() lo evalúe, de modo que campo vacío
  // sea válido (opcional) y texto no-URL produzca error.
  // Se elige esta variante sobre z.preprocess porque encadena bien con el tipado
  // inferido (salida string | undefined) sin necesidad de castear.
  sitio_web: z
    .string()
    .trim()
    .transform(val => (val === '' ? undefined : val))
    .pipe(
      z.string().url('Ingresa una URL válida (ej: https://miempresa.com).').optional()
    ),

  // Ubicación del negocio: se usa como default del mapa al publicar vacantes
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
})

export type CompanyFormValues = z.infer<typeof companySchema>
