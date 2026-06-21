import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface MyReview {
  id: string
  rating: number
  comment: string | null
}

// La unicidad de reseñas es (author_id, company_id): un candidato reseña a cada
// empresa una sola vez, sin importar cuántas postulaciones tenga con ella. Por
// eso la detección de "ya reseñé" es POR EMPRESA, no por postulación: si entró
// desde una segunda postulación a la misma empresa, igual debe ver su reseña
// existente (read-only) en vez de un form vacío que chocaría con el 23505.
export function useMyReviewForCompany(companyId: string | undefined) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<MyReview | null>({
    queryKey: ['my-review', userId, companyId],
    enabled: !!userId && !!companyId,
    queryFn: async () => {
      if (!userId || !companyId) return null

      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment')
        .eq('company_id', companyId)
        .eq('author_id', userId)
        .maybeSingle()

      if (error) throw error

      return data
    },
  })
}
