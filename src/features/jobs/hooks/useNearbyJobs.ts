import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

function nearbyJobsQuery(lat: number | null, lng: number | null, maxM: number | null) {
  return supabase.rpc('jobs_near', {
    p_lat: lat ?? undefined,
    p_lng: lng ?? undefined,
    p_max_m: maxM ?? undefined,
  })
}

export type NearbyJob = NonNullable<Awaited<ReturnType<typeof nearbyJobsQuery>>['data']>[number]

export function useNearbyJobs() {
  const { profile } = useAuth()
  const lat = profile?.lat_referencia ?? null
  const lng = profile?.lng_referencia ?? null
  // El radio elegido en el registro/perfil por fin filtra el feed. Solo aplica
  // con ubicación: sin ella no hay distancias que comparar.
  const maxM = lat != null && profile?.radio_busqueda_km != null ? profile.radio_busqueda_km * 1000 : null

  return useQuery({
    queryKey: ['jobs', 'near', lat, lng, maxM],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await nearbyJobsQuery(lat, lng, maxM)
      if (error) throw error
      return data
    },
  })
}
