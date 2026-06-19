import { useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useImageUpload } from '@/shared/hooks/useImageUpload'
import { useAuth } from '@/features/auth/hooks/useAuth'

export const COMPANY_LOGOS_BUCKET = 'company-logos'

/**
 * Sube el logo de una empresa a `company-logos/{company_id}/logo.webp`, guarda
 * el path en `companies.logo_path` e invalida las queries de empresa (lista del
 * dueño + perfil público), igual que useUpdateCompany.
 *
 * La mutation recibe solo el `File`; el ownerId (companyId) lo inyecta el hook.
 */
export function useUploadCompanyLogo(companyId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const upload = useImageUpload({
    bucket: COMPANY_LOGOS_BUCKET,
    buildPath: ownerId => `${ownerId}/logo.webp`,
    persist: async path => {
      const { error } = await supabase
        .from('companies')
        .update({ logo_path: path })
        .eq('id', companyId)
      if (error) throw error
    },
    onPersisted: () => {
      void queryClient.invalidateQueries({ queryKey: ['company', 'mine', user?.id] })
      void queryClient.invalidateQueries({ queryKey: ['company', 'public', companyId] })
    },
  })

  const uploadLogo = (file: File, opts?: { onSuccess?: () => void; onError?: (err: Error) => void }) => {
    upload.mutate({ ownerId: companyId, file }, { onSuccess: opts?.onSuccess, onError: opts?.onError })
  }

  return { uploadLogo, isUploading: upload.isPending }
}
