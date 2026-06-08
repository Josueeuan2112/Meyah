import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

function nearbyJobsQuery(lat: number | null, lng: number | null) {
  return supabase.rpc('jobs_near', { p_lat: lat ?? undefined, p_lng: lng ?? undefined })
}

export type NearbyJob = NonNullable<Awaited<ReturnType<typeof nearbyJobsQuery>>['data']>[number]

export function useNearbyJobs() {
  const { profile } = useAuth()
  const lat = profile?.lat_referencia ?? null
  const lng = profile?.lng_referencia ?? null

  return useQuery({
    queryKey: ['jobs', 'near', lat, lng],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await nearbyJobsQuery(lat, lng)
      if (error) throw error
      return data
    },
  })
}
