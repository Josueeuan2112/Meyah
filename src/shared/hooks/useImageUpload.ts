import { useMutation } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { processImageToWebp } from '@/shared/lib/processImage'

interface UseImageUploadParams {
  /** Bucket de Storage destino (ej. 'avatars', 'company-logos'). */
  bucket: string
  /** Arma el path del objeto a partir del id del dueño. */
  buildPath: (ownerId: string) => string
  /**
   * Persiste el path en la columna correspondiente. Corre DENTRO del mutationFn
   * (después del upload), por lo que cualquier error que lance se propaga a
   * `onError`. Aquí NO va invalidación de caché: solo la escritura crítica.
   */
  persist: (path: string) => Promise<void>
  /**
   * Efectos no críticos tras persistir con éxito (reloadProfile, invalidate).
   * Corre en onSuccess; un fallo aquí no debe reportarse como error de subida.
   */
  onPersisted?: () => Promise<void> | void
}

/**
 * Hook genérico de subida de imágenes a Storage. Aísla TODA la lógica común
 * (procesar a WebP cuadrado → upload upsert → persistir el path) para no
 * duplicarla por cada caso.
 *
 * IMPORTANTE: el upload Y la escritura de la columna (`persist`) ocurren ambos
 * dentro del mutationFn. En TanStack Query un throw en onSuccess se descarta en
 * silencio; si persistiéramos ahí, un fallo del UPDATE mostraría "éxito" pero la
 * foto no quedaría guardada. Por eso `persist` va en el mutationFn.
 *
 * La mutation recibe `{ ownerId, file }`. El `ownerId` lo pasa el caller (no se
 * deriva de la sesión) para soportar tanto al usuario (perfil) como a recursos
 * que posee (empresa).
 */
export function useImageUpload({ bucket, buildPath, persist, onPersisted }: UseImageUploadParams) {
  return useMutation({
    mutationFn: async ({ ownerId, file }: { ownerId: string; file: File }): Promise<string> => {
      const blob = await processImageToWebp(file)
      const path = buildPath(ownerId)

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { upsert: true, contentType: 'image/webp' })

      if (error) throw error

      // Escritura crítica DENTRO del mutationFn: si falla, propaga a onError.
      await persist(path)

      return path
    },
    onSuccess: async () => {
      await onPersisted?.()
    },
  })
}
