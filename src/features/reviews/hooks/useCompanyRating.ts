import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'

interface CompanyRating {
  averageRating: number
  reviewCount: number
}

export function useCompanyRating(companyId: string | undefined) {
  return useQuery<CompanyRating | null>({
    queryKey: ['company-rating', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      if (!companyId) return null

      const { data, error } = await supabase.rpc('company_rating', {
        p_company_id: companyId,
      })

      if (error) throw error

      // La RPC retorna un array con un solo elemento
      const row = Array.isArray(data) ? data[0] : data
      if (!row || row.review_count === 0) return null

      return {
        averageRating: row.average_rating,
        reviewCount: row.review_count,
      }
    },
    // Rating no cambia muy seguido, cachear por 5 min
    staleTime: 5 * 60 * 1000,
  })
}
