import type { LucideIcon } from 'lucide-react'
import {
  ShoppingCart,
  Headset,
  Store,
  UtensilsCrossed,
  FileText,
  Users,
  Warehouse,
  Wrench,
  Truck,
  HeartPulse,
  Layers,
} from 'lucide-react'

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

// Icono representativo por categoría, usado en landing y feed
export const ICON_BY_CATEGORY: Record<JobCategoryValue, LucideIcon> = {
  ventas: ShoppingCart,
  atencion_cliente: Headset,
  retail: Store,
  restaurantes: UtensilsCrossed,
  administracion: FileText,
  gerencia: Users,
  operativo: Warehouse,
  servicios: Wrench,
  transporte: Truck,
  salud_belleza: HeartPulse,
  otro: Layers,
}

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

export const JOB_SCHEDULES = [
  { value: 'tiempo_completo', label: 'Tiempo completo' },
  { value: 'medio_tiempo',    label: 'Medio tiempo' },
  { value: 'turnos',          label: 'Turnos' },
  { value: 'comision',        label: 'Comisión' },
] as const

export type JobScheduleValue = typeof JOB_SCHEDULES[number]['value']

export const JOB_SCHEDULE_VALUES = JOB_SCHEDULES.map(
  s => s.value
) as [JobScheduleValue, ...JobScheduleValue[]]
