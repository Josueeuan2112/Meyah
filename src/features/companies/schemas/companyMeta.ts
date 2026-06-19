// Metadatos de empresa: categorías, tamaños y helpers de presentación.
// Las listas espejan EXACTAMENTE los CHECK de la migración
// 20260615060000_companies_profile_fields.sql (categoria, tamano). Si cambian
// allá, cambian aquí.

export const COMPANY_CATEGORIES = [
  'Alimentos y bebidas',
  'Comercio y ventas',
  'Servicios profesionales',
  'Manufactura',
  'Construcción',
  'Salud',
  'Tecnología',
  'Turismo y hotelería',
  'Educación',
  'Otra',
] as const

export type CompanyCategory = typeof COMPANY_CATEGORIES[number]

export const COMPANY_CATEGORY_VALUES = COMPANY_CATEGORIES as unknown as [
  CompanyCategory,
  ...CompanyCategory[],
]

// Rango de empleados (valor en BD) → metadata de presentación.
export const COMPANY_SIZES = [
  { value: '1-10',    name: 'Micro',    range: '1–10' },
  { value: '11-50',   name: 'Pequeña',  range: '11–50' },
  { value: '51-200',  name: 'Mediana',  range: '51–200' },
  { value: '201-500', name: 'Grande',     range: '201–500' },
  { value: '500+',    name: 'Corporativo', range: '500+' },
] as const

export type CompanySizeValue = typeof COMPANY_SIZES[number]['value']

export const COMPANY_SIZE_VALUES = COMPANY_SIZES.map(s => s.value) as unknown as [
  CompanySizeValue,
  ...CompanySizeValue[],
]

/** Etiqueta larga para el perfil: "Pequeña · 11–50 empleados". */
export function companySizeLabel(tamano: string | null | undefined): string | null {
  if (!tamano) return null
  const s = COMPANY_SIZES.find(x => x.value === tamano)
  if (!s) return null
  return `${s.name} · ${s.range} empleados`
}

/** Año de alta en Meyah, derivado de created_at (no editable). */
export function memberSinceYear(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null
  const year = new Date(createdAt).getFullYear()
  return Number.isNaN(year) ? null : String(year)
}

// Horario de atención. Estructura libre guardada en companies.horarios (jsonb).
export interface CompanyHorarios {
  lun_vie?: string
  abre_sab?: boolean
  sab?: string
  abre_dom?: boolean
  dom?: string
}

/**
 * Parser defensivo de companies.horarios (llega como Json | null desde la BD).
 * Devuelve siempre un objeto con la forma esperada, ignorando datos corruptos.
 */
export function parseHorarios(value: unknown): CompanyHorarios {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const v = value as Record<string, unknown>
  return {
    lun_vie: typeof v.lun_vie === 'string' ? v.lun_vie : undefined,
    abre_sab: typeof v.abre_sab === 'boolean' ? v.abre_sab : undefined,
    sab: typeof v.sab === 'string' ? v.sab : undefined,
    abre_dom: typeof v.abre_dom === 'boolean' ? v.abre_dom : undefined,
    dom: typeof v.dom === 'string' ? v.dom : undefined,
  }
}

// Redes sociales: definición única reutilizada por editor y perfil.
export const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', glyph: 'IG', placeholder: '@usuario' },
  { key: 'facebook',  label: 'Facebook',  glyph: 'f',  placeholder: 'facebook.com/tuempresa' },
  { key: 'linkedin',  label: 'LinkedIn',  glyph: 'in', placeholder: 'linkedin.com/company/…' },
  { key: 'tiktok',    label: 'TikTok',    glyph: '♪',  placeholder: '@usuario' },
  { key: 'x',         label: 'X',         glyph: 'X',  placeholder: '@usuario' },
] as const

export type SocialKey = typeof SOCIAL_FIELDS[number]['key']
