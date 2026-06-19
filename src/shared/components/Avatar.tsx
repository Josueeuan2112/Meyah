import type { CSSProperties } from 'react'

import { supabase } from '@/shared/lib/supabase'
import { cn } from '@/shared/lib/utils'

interface AvatarProps {
  /** Path nuevo en Storage (ej. 'avatars/{id}/avatar.webp'). Prioridad 1. */
  path?: string | null
  /** URL legacy en columna *_url. Prioridad 2 (si no hay path). */
  legacyUrl?: string | null
  /** Bucket donde vive `path` (necesario para reconstruir la URL pública). */
  bucket?: string
  name: string
  shape?: 'circle' | 'rounded'
  tone?: 'jade' | 'terracota'
  /**
   * Tamaño en px del cuadro. Si se omite, el avatar llena su contenedor
   * (h-full w-full) — útil cuando el padre define un tamaño responsive y se
   * controla el tamaño de las iniciales con `className` (ej. text-[34px]).
   */
  size?: number
  /**
   * Timestamp de la fila (ej. company.updated_at) usado como cache-buster:
   * el path es fijo + upsert reusa la misma URL pública, así que sin token el
   * navegador serviría la foto vieja tras reemplazarla. NO usar Date.now().
   */
  updatedAt?: string | null
  className?: string
}

// Única función de iniciales de toda la app (evita duplicar la regla).
function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return (
    trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase() || '?'
  )
}

/**
 * Componente ÚNICO de presentación imagen-vs-iniciales. Toda decisión de
 * fallback vive aquí; ningún otro componente debe re-implementarla.
 *
 * Prioridad de display: `path` (nuevo) → `legacyUrl` → iniciales de color.
 */
export default function Avatar({
  path,
  legacyUrl,
  bucket,
  name,
  shape = 'circle',
  tone = 'jade',
  size,
  updatedAt,
  className,
}: AvatarProps) {
  let src: string | null = null
  if (path && bucket) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    src = updatedAt ? `${data.publicUrl}?v=${encodeURIComponent(updatedAt)}` : data.publicUrl
  } else if (legacyUrl) {
    src = legacyUrl
  }

  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-3xl'
  const toneBg = tone === 'terracota' ? 'bg-meyah-terracota-500' : 'bg-meyah-jade-500'

  // Con `size`: cuadro fijo en px. Sin `size`: llena el contenedor padre.
  const fixedStyle: CSSProperties | undefined = size != null ? { width: size, height: size } : undefined
  const sizing = size != null ? '' : 'h-full w-full'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        // lazy + async: en listas (postulantes, chats) no bloquea el render ni
        // descarga todo de golpe. width/height reflejan `size` para reservar
        // espacio y reducir CLS.
        loading="lazy"
        decoding="async"
        width={size}
        height={size}
        className={cn('object-cover select-none', radius, sizing, className)}
        style={fixedStyle}
      />
    )
  }

  return (
    <div
      className={cn(
        'grid place-items-center font-display font-semibold text-white select-none',
        radius,
        sizing,
        toneBg,
        className,
      )}
      style={size != null ? { ...fixedStyle, fontSize: Math.round(size * 0.36) } : fixedStyle}
    >
      {getInitials(name)}
    </div>
  )
}
