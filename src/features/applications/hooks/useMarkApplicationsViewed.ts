import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'

// P2 (valor de producto): al abrir la lista de postulantes, las postulaciones
// 'pendiente' pasan a 'vista' (+ viewed_at) en un solo UPDATE. El candidato ve
// el badge "Vista" en sus postulaciones — el mayor dolor de buscar trabajo es
// el silencio, y esto confirma que el empleador al menos las abrió.
// RLS: applications_update_employer limita el update a postulaciones de
// vacantes propias; el trigger de inmutabilidad permite estado/viewed_at
// al empleador.

export function useMarkApplicationsViewed(jobId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!jobId) return

      const { error } = await supabase
        .from('applications')
        .update({ estado: 'vista', viewed_at: new Date().toISOString() })
        .eq('job_id', jobId)
        .eq('estado', 'pendiente')
        .is('deleted_at', null)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications', 'by-job', jobId] })
    },
    // Sin onError con toast: es una acción de fondo, no iniciada por el
    // usuario — si falla, simplemente seguirán como "pendiente".
  })
}
