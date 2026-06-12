import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import type { Job } from '@/shared/types'
import type { JobFormValues } from '@/features/jobs/schemas/jobSchema'

// expires_at: solo lo toca el flujo de "Reabrir" (extender vigencia de una
// vacante vencida); el form de edición nunca lo manda.
type UpdateJobData = Partial<JobFormValues> & { estado?: 'abierta' | 'cerrada'; expires_at?: string }

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateJobData }): Promise<Job> => {
      const { data: updated, error } = await supabase
        .from('jobs')
        // slug: NO — congelado desde creación para preservar URLs existentes
        // company_id: NO — la empresa dueña nunca cambia
        // location: NO — el trigger sync_job_location (BEFORE UPDATE OF lat, lng)
        //            recalcula la columna PostGIS automáticamente
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: (_updated, { id }) => {
      // Prefijo ['jobs','mine']: cubre la lista y las stats de proximidad
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'mine'] })
      // Detalle: dos keys distintas leen esta vacante — 'detail' (useJob, form de
      // edición) y 'detail-full' (useJobDetail, pantalla pública/JobSheet).
      // Sin esto, /vacante/:id seguía mostrando datos viejos tras editar.
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', id] })
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'detail-full', id] })
    },
  })
}
