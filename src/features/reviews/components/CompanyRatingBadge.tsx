import { useCompanyRating } from '@/features/reviews/hooks/useCompanyRating'

interface CompanyRatingBadgeProps {
  companyId: string
}

export function CompanyRatingBadge({ companyId }: CompanyRatingBadgeProps) {
  const { data: rating } = useCompanyRating(companyId)

  if (!rating) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-meyah-crema-100 px-2.5 py-0.5 text-[12px] font-semibold leading-none text-meyah-tinta-900">
      {rating.averageRating.toFixed(1)} ★
      <span className="font-normal text-meyah-tinta-600">
        ({rating.reviewCount} {rating.reviewCount === 1 ? 'resena' : 'resenas'})
      </span>
    </span>
  )
}
