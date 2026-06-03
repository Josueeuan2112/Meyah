import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import type { Job } from '@/shared/types'

export function useJob(id: string | undefined) {
  return useQuery<Job | null>({
    queryKey: ['jobs', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id!)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
