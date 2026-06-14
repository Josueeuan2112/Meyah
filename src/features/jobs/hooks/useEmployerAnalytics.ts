import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { supabase } from '@/shared/lib/supabase'

function employerAnalyticsQuery() {
  return supabase.rpc('employer_analytics')
}

export type EmployerAnalyticsRow = NonNullable<
  Awaited<ReturnType<typeof employerAnalyticsQuery>>['data']
>[number]

export function useEmployerAnalytics() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['analytics', 'employer', userId],
    queryFn: async () => {
      const { data, error } = await employerAnalyticsQuery()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
