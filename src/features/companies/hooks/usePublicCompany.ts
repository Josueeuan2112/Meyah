import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import type { Company } from '@/shared/types'

/**
 * Lee la fila pública de una empresa por id. Usa la policy
 * `companies_select_public` (cualquiera lee si deleted_at IS NULL). Devuelve
 * todos los campos del perfil público (incluye owner_id, necesario para iniciar
 * una conversación con la empresa).
 */
export function usePublicCompany(id: string | undefined) {
  return useQuery<Company | null>({
    queryKey: ['company', 'public', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id!)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })
}
