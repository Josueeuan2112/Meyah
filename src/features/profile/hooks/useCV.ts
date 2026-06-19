import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useUploadCV() {
  const { user, reloadProfile } = useAuth()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Sesión no válida')

      if (file.type !== 'application/pdf') {
        throw new Error('Solo se permiten archivos PDF.')
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo no puede superar 5 MB.')
      }

      const path = `${user.id}/cv.pdf`

      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' })

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cv_path: path })
        .eq('id', user.id)

      if (updateError) throw updateError

      return path
    },
    onSuccess: async () => {
      await reloadProfile()
    },
  })
}

export function useDeleteCV() {
  const { user, reloadProfile } = useAuth()

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Sesión no válida')

      const path = `${user.id}/cv.pdf`

      const { error: deleteError } = await supabase.storage
        .from('cvs')
        .remove([path])

      if (deleteError) throw deleteError

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cv_path: null })
        .eq('id', user.id)

      if (updateError) throw updateError
    },
    onSuccess: async () => {
      await reloadProfile()
    },
  })
}

export async function getSignedCVUrl(cvPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('cvs')
    .createSignedUrl(cvPath, 300) // 5 min expiry

  if (error) {
    toast.error('No se pudo obtener el CV.')
    return null
  }
  return data.signedUrl
}
