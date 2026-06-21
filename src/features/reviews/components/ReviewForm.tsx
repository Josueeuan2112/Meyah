import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { StarRating } from '@/features/reviews/components/StarRating'
import { useCreateReview } from '@/features/reviews/hooks/useCreateReview'
import { useMyReviewForCompany } from '@/features/reviews/hooks/useMyReviewForCompany'
import {
  reviewSchema,
  type ReviewFormData,
  MAX_COMMENT_LENGTH,
} from '@/features/reviews/schemas/review.schema'

interface ReviewFormProps {
  applicationId: string
  companyId: string
  onSuccess?: () => void
}

export function ReviewForm({ applicationId, companyId, onSuccess }: ReviewFormProps) {
  // Detección por EMPRESA (no por postulación): la unicidad de reseñas es
  // (author_id, company_id). Si el candidato ya reseñó esta empresa desde otra
  // postulación, mostramos su reseña existente (read-only) en lugar de un form
  // vacío que fallaría con 23505 al enviar.
  const { data: existingReview, isLoading: isLoadingReview } = useMyReviewForCompany(companyId)
  const createReview = useCreateReview()

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    // rating arranca en 0 (sin elegir): el min(1) del schema bloquea el envío.
    defaultValues: { rating: 0, comment: '' },
  })

  // Patrón watch + setValue: StarRating no es un <input>, así que reflejamos su
  // valor en el form con setValue y lo leemos con watch (sin estado paralelo).
  const rating = watch('rating')
  const comment = watch('comment') ?? ''

  if (isLoadingReview) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Ya existe una reseña de este candidato para esta empresa (desde cualquier
  // postulación): se muestra read-only.
  if (existingReview) {
    return (
      <div className="rounded-field border border-meyah-jade-500/20 bg-meyah-jade-50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-meyah-jade-700" />
          <p className="text-[13px] font-semibold text-meyah-jade-700">Tu calificación</p>
        </div>
        <div className="mt-2">
          <StarRating value={existingReview.rating} readonly size={16} />
        </div>
        {existingReview.comment && (
          <p className="mt-2 text-[13px] text-meyah-tinta-600">{existingReview.comment}</p>
        )}
      </div>
    )
  }

  const onSubmit = (data: ReviewFormData) => {
    createReview.mutate(
      {
        applicationId,
        companyId,
        rating: data.rating,
        comment: data.comment?.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Calificación enviada')
          onSuccess?.()
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-meyah-tinta-900">
          Tu calificación
        </label>
        <StarRating
          value={rating}
          onChange={(value) => setValue('rating', value, { shouldValidate: true })}
          size={24}
        />
        {errors.rating && (
          <p className="mt-1 text-[12px] text-meyah-terracota-700">{errors.rating.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-meyah-tinta-900">
          Comentario <span className="font-normal text-meyah-tinta-400">(opcional)</span>
        </label>
        <Textarea
          placeholder="Comparte tu experiencia con esta empresa…"
          className="min-h-20 text-[13.5px]"
          maxLength={MAX_COMMENT_LENGTH}
          aria-invalid={!!errors.comment}
          {...register('comment')}
        />
        <p className="mt-1 text-right text-[11px] text-meyah-tinta-400">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </p>
        {errors.comment && (
          <p className="text-[12px] text-meyah-terracota-700">{errors.comment.message}</p>
        )}
      </div>

      <Button type="submit" size="sm" disabled={rating === 0 || createReview.isPending}>
        {createReview.isPending && <Loader2 className="size-3.5 animate-spin" />}
        Enviar calificación
      </Button>
    </form>
  )
}
