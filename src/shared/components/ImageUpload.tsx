import { useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'

import Avatar from '@/shared/components/Avatar'
import { cn } from '@/shared/lib/utils'

interface ImageUploadProps {
  currentPath?: string | null
  legacyUrl?: string | null
  name: string
  bucket: string
  tone?: 'jade' | 'terracota'
  shape?: 'circle' | 'rounded'
  size?: number
  isUploading: boolean
  onFile: (file: File) => void
  updatedAt?: string | null
  /** Clases del contenedor posicionado. */
  className?: string
  /** Clases pasadas al <Avatar> interior (ej. ring/shadow). */
  avatarClassName?: string
}

/**
 * Componente "tonto" de captura: muestra el <Avatar> actual + un botón de cámara
 * que abre el selector de archivo. No conoce Supabase; entrega el File al caller.
 *
 * Sin `capture` fijo: en desktop forzaría la webcam. Con `accept` de imagen, el
 * móvil ya ofrece elegir entre cámara y galería.
 */
export default function ImageUpload({
  currentPath,
  legacyUrl,
  name,
  bucket,
  tone = 'jade',
  shape = 'circle',
  size = 104,
  isUploading,
  onFile,
  updatedAt,
  className,
  avatarClassName,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset SIEMPRE para permitir re-seleccionar el mismo archivo.
    e.target.value = ''
    if (file) onFile(file)
  }

  return (
    <div className={cn('relative flex-none', className)} style={{ width: size, height: size }}>
      <Avatar
        path={currentPath}
        legacyUrl={legacyUrl}
        bucket={bucket}
        name={name}
        tone={tone}
        shape={shape}
        size={size}
        updatedAt={updatedAt}
        className={cn(avatarClassName, isUploading && 'opacity-50')}
      />

      {isUploading && (
        <div className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-7 animate-spin text-white drop-shadow" />
        </div>
      )}

      <button
        type="button"
        aria-label="Cambiar foto"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="absolute -bottom-0.5 -right-0.5 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-meyah-tinta-900 text-white shadow-md transition hover:bg-meyah-jade-700 disabled:opacity-60"
      >
        <Camera size={14} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
