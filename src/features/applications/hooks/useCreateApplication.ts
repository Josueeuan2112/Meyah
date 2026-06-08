import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface CreateApplicationInput {
  jobId: string
  mensaje: string | null
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ jobId, mensaje }: CreateApplicationInput) => {
      if (!user) throw new Error('Sesión no válida')

      const { error } = await supabase
        .from('applications')
        .insert({ candidato_id: user.id, job_id: jobId, mensaje })

      if (error) {
        if (error.code === '23505') throw new Error('Ya te postulaste a esta vacante.')
        throw error
      }
    },
    onSuccess: (_, variables) => {
      if (user) {
        void queryClient.invalidateQueries({ queryKey: ['applications', 'mine', user.id] })
        void queryClient.invalidateQueries({ queryKey: ['applications', 'for-job', user.id, variables.jobId] })
      }
    },
  })
}
