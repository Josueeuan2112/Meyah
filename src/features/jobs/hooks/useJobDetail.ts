import { useQuery } from '@tanstack/react-query'
import type { QueryData } from '@supabase/supabase-js'

import { supabase } from '@/shared/lib/supabase'

function buildJobDetailQuery(id: string) {
  return supabase
    .from('jobs')
    .select('*, company:companies(id, nombre, descripcion, sitio_web, logo_url, is_verified)')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
}

export type JobDetail = NonNullable<QueryData<ReturnType<typeof buildJobDetailQuery>>>

export function useJobDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'detail-full', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('ID de vacante requerido')

      const { data, error } = await buildJobDetailQuery(id)

      if (error) throw error

      return data
    },
  })
}
