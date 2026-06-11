import type { ApplicationStatus } from '@/shared/types'

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pendiente: 'Pendiente',
  vista: 'Vista',
  rechazada: 'Rechazada',
  aceptada: 'Aceptada',
}

export const APPLICATION_STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
  pendiente: 'bg-meyah-crema-100 text-meyah-tinta-600',
  vista: 'bg-meyah-terracota-50 text-meyah-terracota-700',
  aceptada: 'bg-meyah-jade-50 text-meyah-jade-700',
  rechazada: 'bg-meyah-tinta-900/[0.06] text-meyah-tinta-500',
}
