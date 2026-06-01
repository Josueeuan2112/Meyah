import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Company } from '@/shared/types'
import type { CompanyFormValues } from '@/features/companies/schemas/companySchema'

export function useCreateCompany() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CompanyFormValues): Promise<Company> => {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          nombre: input.nombre,
          descripcion: input.descripcion,
          direccion: input.direccion,
          // undefined se convierte en null: la columna es nullable,
          // nunca insertamos string vacío
          sitio_web: input.sitio_web ?? null,
          owner_id: user!.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidar la query de useMyCompany para forzar un refresco
      void queryClient.invalidateQueries({ queryKey: ['company', 'mine', user?.id] })
    },
  })
}
