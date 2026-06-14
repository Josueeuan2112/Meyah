import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { StarRating } from '@/features/reviews/components/StarRating'
import { useCreateReview } from '@/features/reviews/hooks/useCreateReview'
import { useMyReviewForApplication } from '@/features/reviews/hooks/useMyReviewForApplication'

interface ReviewFormProps {
  applicationId: string
  companyId: string
  onSuccess?: () => void
}

const MAX_COMMENT_LENGTH = 300

export function ReviewForm({ applicationId, companyId, onSuccess }: ReviewFormProps) {
  const { data: existingReview, isLoading: isLoadingReview } = useMyReviewForApplication(applicationId)
  const createReview = useCreateReview()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  if (isLoadingReview) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Ya existe una resena para esta postulacion
  if (existingReview) {
    return (
      <div className="rounded-field border border-meyah-jade-500/20 bg-meyah-jade-50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-meyah-jade-700" />
          <p className="text-[13px] font-semibold text-meyah-jade-700">Tu calificacion</p>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Selecciona una calificacion')
      return
    }

    createReview.mutate(
      {
        applicationId,
        companyId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Calificacion enviada')
          onSuccess?.()
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-meyah-tinta-900">
          Tu calificacion
        </label>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-meyah-tinta-900">
          Comentario <span className="font-normal text-meyah-tinta-400">(opcional)</span>
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          placeholder="Comparte tu experiencia con esta empresa..."
          className="min-h-20 text-[13.5px]"
          maxLength={MAX_COMMENT_LENGTH}
        />
        <p className="mt-1 text-right text-[11px] text-meyah-tinta-400">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </p>
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={rating === 0 || createReview.isPending}
      >
        {createReview.isPending && <Loader2 className="size-3.5 animate-spin" />}
        Enviar calificacion
      </Button>
    </form>
  )
}
