import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Company } from '@/shared/types'
import type { CompanyFormValues } from '@/features/companies/schemas/companySchema'

export function useUpdateCompany() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormValues }): Promise<Company> => {
      const { data: updated, error } = await supabase
        .from('companies')
        .update({
          nombre: data.nombre,
          descripcion: data.descripcion,
          direccion: data.direccion,
          // undefined se convierte en null: la columna es nullable,
          // nunca actualizamos con string vacío
          sitio_web: data.sitio_web ?? null,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company', 'mine', user?.id] })
    },
  })
}
