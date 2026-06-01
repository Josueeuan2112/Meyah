// ADVERTENCIA: los dos updates de soft-delete NO son una transacción atómica real.
// Si el paso 2 (job) fallara tras el paso 1 (applications), las postulaciones quedarían
// eliminadas pero el job seguiría vivo. Riesgo bajo en MVP; en el futuro mover a una
// función RPC de Postgres que ejecute ambos updates dentro de una transacción real.
// TODO: reemplazar por rpc('soft_delete_job', { job_id }) cuando haya más volumen.

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'

export function useDeleteJob() {
  const queryClient = useQueryClient()
  const { data: company } = useMyCompany()

  return useMutation({
    mutationFn: async (jobId: string): Promise<void> => {
      const deletedAt = new Date().toISOString()

      // Paso 1 — postulaciones primero: si algo falla después, el job sigue vivo
      // y el estado es recuperable. Un job fantasma sin postulaciones sería peor.
      const { error: appsError } = await supabase
        .from('applications')
        .update({ deleted_at: deletedAt })
        .eq('job_id', jobId)
        .is('deleted_at', null)

      if (appsError) throw appsError

      // Paso 2 — la vacante
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ deleted_at: deletedAt })
        .eq('id', jobId)

      if (jobError) throw jobError
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'mine', company?.id] })
    },
  })
}
