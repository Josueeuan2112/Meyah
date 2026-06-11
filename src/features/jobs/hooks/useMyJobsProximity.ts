import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'

function myJobsProximityQuery() {
  return supabase.rpc('my_jobs_applicant_proximity', { p_max_m: 3000 })
}

export type JobApplicantProximity = NonNullable<Awaited<ReturnType<typeof myJobsProximityQuery>>['data']>[number]

export function useMyJobsProximity() {
  return useQuery({
    queryKey: ['jobs', 'mine', 'proximity'],
    queryFn: async () => {
      const { data, error } = await myJobsProximityQuery()
      if (error) throw error
      return data
    },
  })
}
