import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import type { Job } from '@/shared/types'

export function useMyJobs() {
  const { data: company } = useMyCompany()
  const companyId = company?.id

  return useQuery<Job[]>({
    queryKey: ['jobs', 'mine', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!companyId,
  })
}
