import { useQuery } from '@tanstack/react-query'
import type { QueryData } from '@supabase/supabase-js'

import { supabase } from '@/shared/lib/supabase'

// "Otras vacantes" del perfil público: vacantes abiertas y vigentes de la
// empresa. Reusa la policy pública de jobs (select abierto). No incluye conteos
// privados (eso vive en el dashboard del empleador).
function buildCompanyJobsQuery(companyId: string) {
  const nowIso = new Date().toISOString()
  return supabase
    .from('jobs')
    .select('id, titulo, categoria, jornada, salario_min, salario_max, created_at')
    .eq('company_id', companyId)
    .eq('estado', 'abierta')
    .is('deleted_at', null)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(12)
}

export type CompanyJob = QueryData<ReturnType<typeof buildCompanyJobsQuery>>[number]

export function useCompanyJobs(companyId: string | undefined) {
  return useQuery<CompanyJob[]>({
    queryKey: ['jobs', 'by-company', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await buildCompanyJobsQuery(companyId!)
      if (error) throw error
      return data
    },
  })
}
