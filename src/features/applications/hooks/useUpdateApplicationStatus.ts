import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import type { ApplicationStatus, ApplicationUpdate } from '@/shared/types'

interface UpdateApplicationStatusInput {
  id: string
  estado: ApplicationStatus
}

export function useUpdateApplicationStatus(jobId: string) {
  const queryClient = useQueryClient()
  const { data: company } = useMyCompany()

  return useMutation({
    mutationFn: async ({ id, estado }: UpdateApplicationStatusInput) => {
      const now = new Date().toISOString()
      const patch: ApplicationUpdate = { estado }

      if (estado === 'aceptada' || estado === 'rechazada') patch.responded_at = now
      else if (estado === 'vista') patch.viewed_at = now

      const { error } = await supabase
        .from('applications')
        .update(patch)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications', 'by-job', jobId] })
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'mine', company?.id] })
    },
  })
}
