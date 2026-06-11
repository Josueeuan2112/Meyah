import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import type { Job } from '@/shared/types'
import type { JobFormValues } from '@/features/jobs/schemas/jobSchema'

type UpdateJobData = Partial<JobFormValues> & { estado?: 'abierta' | 'cerrada' }

export function useUpdateJob() {
  const queryClient = useQueryClient()
  const { data: company } = useMyCompany()

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'mine', company?.id] })
    },
  })
}
