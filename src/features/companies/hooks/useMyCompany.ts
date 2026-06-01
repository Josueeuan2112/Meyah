import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Company } from '@/shared/types'

export function useMyCompany() {
  const { user } = useAuth()

  return useQuery<Company | null>({
    queryKey: ['company', 'mine', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user!.id)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}
