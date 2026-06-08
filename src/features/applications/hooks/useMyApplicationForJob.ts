import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Application } from '@/shared/types'

export function useMyApplicationForJob(jobId: string | undefined) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<Application | null>({
    queryKey: ['applications', 'for-job', userId, jobId],
    enabled: !!userId && !!jobId,
    queryFn: async () => {
      if (!userId || !jobId) throw new Error('Sesión o vacante no válida')

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('candidato_id', userId)
        .eq('job_id', jobId)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw error

      return data
    },
  })
}
