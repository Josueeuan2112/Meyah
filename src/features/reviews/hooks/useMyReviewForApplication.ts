import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface MyReview {
  id: string
  rating: number
  comment: string | null
}

export function useMyReviewForApplication(applicationId: string | undefined) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<MyReview | null>({
    queryKey: ['my-review', userId, applicationId],
    enabled: !!userId && !!applicationId,
    queryFn: async () => {
      if (!userId || !applicationId) return null

      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment')
        .eq('application_id', applicationId)
        .eq('author_id', userId)
        .maybeSingle()

      if (error) throw error

      return data
    },
  })
}
