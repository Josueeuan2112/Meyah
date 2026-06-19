import { useInfiniteQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

// Tope alineado con el default de la RPC jobs_near (p_limit default 30, máx 50).
const PAGE_SIZE = 30

function nearbyJobsQuery(
  lat: number | null,
  lng: number | null,
  maxM: number | null,
  offset: number,
) {
  return supabase.rpc('jobs_near', {
    p_lat: lat ?? undefined,
    p_lng: lng ?? undefined,
    p_max_m: maxM ?? undefined,
    p_limit: PAGE_SIZE,
    p_offset: offset,
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

  return useInfiniteQuery({
    queryKey: ['jobs', 'near', lat, lng, maxM],
    enabled: !!profile,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await nearbyJobsQuery(lat, lng, maxM, pageParam)
      if (error) throw error
      return data ?? []
    },
    // Si la última página llegó completa (PAGE_SIZE filas) hay más por traer;
    // el siguiente offset avanza un bloque. Página parcial = fin del feed.
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  })
}
