import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'

// Soft-delete vía RPC soft_delete_job: marca la vacante Y sus postulaciones
// en UNA transacción de Postgres (antes eran dos updates desde el cliente y
// un fallo a medias dejaba estado corrupto). SECURITY INVOKER: la RLS sigue
// aplicando — si el caller no es dueño, la RPC devuelve false y no toca nada.

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string): Promise<void> => {
      const { data: deleted, error } = await supabase.rpc('soft_delete_job', {
        p_job_id: jobId,
      })

      if (error) throw error
      if (!deleted) throw new Error('La vacante no existe o no te pertenece.')
    },
    onSuccess: (_void, jobId) => {
      // Prefijo ['jobs','mine']: cubre la lista (['jobs','mine',companyId])
      // y las stats de proximidad (['jobs','mine','proximity']) de un golpe
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'mine'] })
      // El detalle cacheado seguía mostrando la vacante ya borrada; ambas
      // queries filtran deleted_at, así que al refetch desaparece.
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] })
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'detail-full', jobId] })
    },
  })
}
