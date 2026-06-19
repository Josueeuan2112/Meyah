import { supabase } from '@/shared/lib/supabase'
import { useImageUpload } from '@/shared/hooks/useImageUpload'
import { useAuth } from '@/features/auth/hooks/useAuth'

export const AVATARS_BUCKET = 'avatars'

/**
 * Sube la foto de perfil del usuario a `avatars/{user_id}/avatar.webp`, guarda
 * el path en `profiles.avatar_path` y refresca el profile + caché.
 *
 * La mutation recibe solo el `File`; el ownerId (user.id) lo inyecta el hook.
 */
export function useUploadAvatar() {
  const { user, reloadProfile } = useAuth()

  const upload = useImageUpload({
    bucket: AVATARS_BUCKET,
    buildPath: ownerId => `${ownerId}/avatar.webp`,
    persist: async path => {
      if (!user) throw new Error('Sesión no válida')
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_path: path })
        .eq('id', user.id)
      if (error) throw error
    },
    onPersisted: async () => {
      await reloadProfile()
    },
  })

  const uploadAvatar = (file: File, opts?: { onSuccess?: () => void; onError?: (err: Error) => void }) => {
    if (!user) {
      opts?.onError?.(new Error('Sesión no válida'))
      return
    }
    upload.mutate({ ownerId: user.id, file }, { onSuccess: opts?.onSuccess, onError: opts?.onError })
  }

  return { uploadAvatar, isUploading: upload.isPending }
}
