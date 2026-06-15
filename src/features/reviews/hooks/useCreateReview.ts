import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface CreateReviewInput {
  applicationId: string
  companyId: string
  rating: number
  comment?: string
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ applicationId, companyId, rating, comment }: CreateReviewInput) => {
      if (!user) throw new Error('Sesion no valida')

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('La calificación debe ser un número entero entre 1 y 5')
      }

      const { error } = await supabase.from('reviews').insert({
        application_id: applicationId,
        author_id: user.id,
        company_id: companyId,
        rating,
        comment: comment ?? null,
      })

      if (error) {
        if (error.code === '23505') throw new Error('Ya calificaste esta experiencia.')
        throw error
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['reviews'] })
      void queryClient.invalidateQueries({ queryKey: ['company-rating', variables.companyId] })
      if (user) {
        void queryClient.invalidateQueries({
          queryKey: ['my-review', user.id, variables.applicationId],
        })
      }
    },
  })
}
