import { useQuery } from '@tanstack/react-query'
import type { QueryData } from '@supabase/supabase-js'

import { supabase } from '@/shared/lib/supabase'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'

function buildMyJobsQuery(companyId: string) {
  return supabase
    .from('jobs')
    .select('*, applications(count)')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .is('applications.deleted_at', null)
    .order('created_at', { ascending: false })
}

export type MyJob = QueryData<ReturnType<typeof buildMyJobsQuery>>[number]

export function useMyJobs() {
  const { data: company } = useMyCompany()
  const companyId = company?.id

  return useQuery<MyJob[]>({
    queryKey: ['jobs', 'mine', companyId],
    queryFn: async () => {
      const { data, error } = await buildMyJobsQuery(companyId!)
      if (error) throw error
      return data
    },
    enabled: !!companyId,
  })
}
