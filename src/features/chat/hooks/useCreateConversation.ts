import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface CreateConversationInput {
  jobId: string
  candidatoId: string
}

export function useCreateConversation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId, candidatoId }: CreateConversationInput) => {
      if (!user) throw new Error('Sesión no válida')

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('job_id', jobId)
        .eq('candidato_id', candidatoId)
        .maybeSingle()

      if (existing) return existing.id

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          job_id: jobId,
          candidato_id: candidatoId,
          empleador_id: user.id,
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations', 'list'] })
    },
  })
}
