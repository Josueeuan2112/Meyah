import { z } from 'zod'

import {
  COMPANY_CATEGORY_VALUES,
  COMPANY_SIZE_VALUES,
} from '@/features/companies/schemas/companyMeta'

// Helper para texto opcional: acepta string | undefined (campos no registrados
// en el form de creación llegan como undefined), recorta, y normaliza '' →
// undefined para no persistir cadenas vacías. Valida longitud máxima.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform(v => (v && v.length ? v : undefined))

export const companySchema = z.object({
  // ── Campos base (ya existentes, requeridos) ────────────────────────────────
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre de la empresa es obligatorio.')
    .max(120),

  descripcion: z
    .string()
    .trim()
    .min(20, 'La descripción debe tener al menos 20 caracteres.')
    .max(2000),

  direccion: z
    .string()
    .trim()
    .min(5, 'La dirección es obligatoria.')
    .max(200),

  // Acepta URL http(s) válida o vacío; '' → undefined (campo opcional, nunca '').
  // El regex http(s) es obligatorio: z.url() acepta esquemas peligrosos como
  // javascript:/data:, que renderizados en un <a href> serían XSS almacenado
  // (empleador → candidato). Se exige http/https tanto aquí como en el render.
  sitio_web: z
    .string()
    .trim()
    .url('Ingresa una URL válida (ej: https://miempresa.com).')
    .regex(/^https?:\/\//i, 'El sitio web debe iniciar con http:// o https://.')
    .or(z.literal(''))
    .optional()
    .transform(v => (v ? v : undefined)),

  // Ubicación del negocio: default del mapa al publicar vacantes
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),

  // ── Campos de perfil público (nuevos, todos opcionales) ────────────────────
  razon_social: optionalText(120),

  correo: z
    .string()
    .trim()
    .max(160)
    .email('Ingresa un correo válido.')
    .or(z.literal(''))
    .optional()
    .transform(v => (v ? v : undefined)),

  // Alineado con el CHECK de la BD (7–25). '' → undefined (opcional).
  telefono: z
    .string()
    .trim()
    .min(7, 'Teléfono demasiado corto.')
    .max(25)
    .or(z.literal(''))
    .optional()
    .transform(v => (v ? v : undefined)),

  categoria: z
    .enum(COMPANY_CATEGORY_VALUES)
    .or(z.literal(''))
    .optional()
    .transform(v => (v ? v : undefined)),

  tamano: z
    .enum(COMPANY_SIZE_VALUES)
    .or(z.literal(''))
    .optional()
    .transform(v => (v ? v : undefined)),

  historia: optionalText(2000),
  mision: optionalText(2000),
  vision: optionalText(2000),

  // El servidor solo acota cardinalidad (≤12); el límite por elemento vive aquí.
  valores: z
    .array(z.string().trim().min(1).max(60))
    .max(12, 'Máximo 12 valores.')
    .default([]),
  beneficios: z
    .array(z.string().trim().min(1).max(80))
    .max(12, 'Máximo 12 beneficios.')
    .default([]),

  // Solo display + future-proof: no se conecta a queries de cercanía todavía.
  radio_km: z
    .number()
    .int()
    .min(1)
    .max(25)
    .nullable()
    .optional(),

  horarios: z
    .object({
      lun_vie: optionalText(60),
      abre_sab: z.boolean().optional(),
      sab: optionalText(60),
      abre_dom: z.boolean().optional(),
      dom: optionalText(60),
    })
    // Si el día está marcado como cerrado, no persistimos su horario (evita
    // dejar una cadena huérfana cuando el usuario desactiva sábado/domingo).
    .transform(h => ({
      lun_vie: h.lun_vie,
      abre_sab: h.abre_sab,
      sab: h.abre_sab ? h.sab : undefined,
      abre_dom: h.abre_dom,
      dom: h.abre_dom ? h.dom : undefined,
    }))
    .optional(),

  instagram: optionalText(200),
  facebook: optionalText(200),
  linkedin: optionalText(200),
  tiktok: optionalText(200),
  x: optionalText(200),
})

export type CompanyFormValues = z.infer<typeof companySchema>
export type CompanyFormInput = z.input<typeof companySchema>
