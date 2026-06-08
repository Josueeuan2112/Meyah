import type { ApplicationStatus } from '@/shared/types'

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pendiente: 'Pendiente',
  vista: 'Vista',
  rechazada: 'Rechazada',
  aceptada: 'Aceptada',
}
