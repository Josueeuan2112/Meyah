import { useState } from 'react'
import { Star } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
}

export function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const displayValue = hovered || value

  return (
    <div
      className={cn('inline-flex gap-0.5', !readonly && 'cursor-pointer')}
      onMouseLeave={() => !readonly && setHovered(0)}
      role={readonly ? 'img' : 'radiogroup'}
      aria-label={`Calificacion: ${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            'transition-colors duration-150',
            readonly && 'pointer-events-none',
            !readonly && 'hover:scale-110 active:scale-95',
          )}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={cn(
              'transition-colors duration-150',
              star <= displayValue
                ? 'fill-meyah-jade-500 text-meyah-jade-500'
                : 'fill-none text-meyah-tinta-300',
            )}
          />
        </button>
      ))}
    </div>
  )
}
