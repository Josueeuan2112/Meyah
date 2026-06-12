import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'

// P4 (valor de producto): cuántos candidatos buscables viven a <3 km del pin
// del form de vacante. La RPC candidates_near_count devuelve solo el agregado
// (cero PII) y respeta is_searchable.
// Redondeo a 3 decimales (~110 m): el drag del pin emite decenas de
// coordenadas por segundo y sin redondeo cada pixel sería una query nueva.

export function useCandidatesNearCount(lat: number, lng: number) {
  const rLat = Math.round(lat * 1000) / 1000
  const rLng = Math.round(lng * 1000) / 1000

  return useQuery({
    queryKey: ['candidates', 'near-count', rLat, rLng],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('candidates_near_count', {
        p_lat: rLat,
        p_lng: rLng,
      })
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
    // Mantiene el número anterior mientras llega el nuevo: sin parpadeo al mover el pin
    placeholderData: keepPreviousData,
  })
}
