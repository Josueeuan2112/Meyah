import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { supabase } from '@/shared/lib/supabase'

function employerDailyStatsQuery(days?: number) {
  return supabase.rpc('employer_daily_stats', { p_days: days })
}

export type EmployerDailyStatsRow = NonNullable<
  Awaited<ReturnType<typeof employerDailyStatsQuery>>['data']
>[number]

export function useEmployerDailyStats(days = 30) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['analytics', 'daily', userId],
    queryFn: async () => {
      const { data, error } = await employerDailyStatsQuery(days)
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
