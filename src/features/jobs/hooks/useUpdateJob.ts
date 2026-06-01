import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import type { Job } from '@/shared/types'
import type { JobFormValues } from '@/features/jobs/schemas/jobSchema'

export function useUpdateJob() {
  const queryClient = useQueryClient()
  const { data: company } = useMyCompany()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: JobFormValues }): Promise<Job> => {
      const { data: updated, error } = await supabase
        .from('jobs')
        .update({
          titulo:      data.titulo,
          descripcion: data.descripcion,
          categoria:   data.categoria,
          salario_min: data.salario_min,
          salario_max: data.salario_max,
          lat:         data.lat,
          lng:         data.lng,
          // slug: NO — congelado desde creación para preservar URLs existentes
          // company_id: NO — la empresa dueña nunca cambia
          // location: NO — el trigger sync_job_location (BEFORE UPDATE OF lat, lng)
          //            recalcula la columna PostGIS automáticamente
        })
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
