export const JOB_CATEGORIES = [
  { value: 'ventas',           label: 'Ventas' },
  { value: 'atencion_cliente', label: 'Atención al cliente' },
  { value: 'retail',           label: 'Retail y tienda' },
  { value: 'restaurantes',     label: 'Restaurantes y cocina' },
  { value: 'administracion',   label: 'Oficina y administración' },
  { value: 'gerencia',         label: 'Gerencia y supervisión' },
  { value: 'operativo',        label: 'Operativo y almacén' },
  { value: 'servicios',        label: 'Servicios generales' },
  { value: 'transporte',       label: 'Transporte y logística' },
  { value: 'salud_belleza',    label: 'Salud y belleza' },
  { value: 'otro',             label: 'Otro' },
] as const

// Tipo union de todos los value literales
export type JobCategoryValue = typeof JOB_CATEGORIES[number]['value']

// Array de solo values. El cast a tupla no-vacía es requerido por z.enum(),
// que necesita garantía estática de que hay al menos un elemento.
export const JOB_CATEGORY_VALUES = JOB_CATEGORIES.map(
  c => c.value
) as [JobCategoryValue, ...JobCategoryValue[]]

// Traduce value → label para mostrar en listas y filtros.
// Acepta string genérico para poder usarse con datos que llegan de la BD.
export function getCategoryLabel(value: string): string {
  return JOB_CATEGORIES.find(c => c.value === value)?.label ?? value
}
