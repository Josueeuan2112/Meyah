import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import type { Job } from '@/shared/types'

export function useCloseJob() {
  const queryClient = useQueryClient()
  const { data: company } = useMyCompany()

  return useMutation({
    mutationFn: async (id: string): Promise<Job> => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ estado: 'cerrada' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'mine', company?.id] })
    },
  })
}
