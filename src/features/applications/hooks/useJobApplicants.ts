import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'

function jobApplicantsNearQuery(jobId: string) {
  return supabase.rpc('job_applicants_near', { p_job_id: jobId })
}

export type JobApplicant = NonNullable<Awaited<ReturnType<typeof jobApplicantsNearQuery>>['data']>[number]

export function useJobApplicants(jobId: string | undefined) {
  return useQuery({
    queryKey: ['applications', 'by-job', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      if (!jobId) throw new Error('Vacante no válida')

      const { data, error } = await jobApplicantsNearQuery(jobId)

      if (error) throw error

      return data
    },
  })
}
