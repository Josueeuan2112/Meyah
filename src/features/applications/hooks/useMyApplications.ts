import { useQuery } from '@tanstack/react-query'
import type { QueryData } from '@supabase/supabase-js'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

function buildMyApplicationsQuery(userId: string) {
  return supabase
    .from('applications')
    .select('id, estado, created_at, job:jobs(id, titulo, slug, estado, categoria, salario_min, salario_max, company_id, company:companies(nombre))')
    .eq('candidato_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
}

export type MyApplication = QueryData<ReturnType<typeof buildMyApplicationsQuery>>[number]


export function useMyApplications() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['applications', 'mine', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error('Sesión no válida')

      const { data, error } = await buildMyApplicationsQuery(userId)

      if (error) throw error

      return data
    },
  })
}
