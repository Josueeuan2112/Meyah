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

      // Check if an ACTIVE conversation already exists. Se excluyen las
      // soft-deleted (deleted_at): una conversación de un job borrado por la
      // cascada queda "zombie" (no listada, sin envío de mensajes), así que NO
      // debe reutilizarse — hay que crear una activa nueva.
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('job_id', jobId)
        .eq('candidato_id', candidatoId)
        .is('deleted_at', null)
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

      // 23505 = el índice único (job_id, candidato_id) ya tenía una fila. Dos
      // causas: (a) otra pestaña/doble clic creó la conversación en paralelo, o
      // (b) existe una conversación soft-deleted que sigue ocupando el slot del
      // índice (el unique parcial NO excluye deleted_at). Recuperamos SOLO si
      // hay una activa (mismo criterio del find inicial). Si lo que bloquea es
      // una zombie, no hay fila activa que devolver -> error claro.
      if (error) {
        if (error.code === '23505') {
          const { data: raced, error: raceErr } = await supabase
            .from('conversations')
            .select('id')
            .eq('job_id', jobId)
            .eq('candidato_id', candidatoId)
            .is('deleted_at', null)
            .maybeSingle()
          if (raceErr) throw raceErr
          if (!raced) throw new Error('Esta conversación ya no está disponible.')
          return raced.id
        }
        throw error
      }
      return data.id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations', 'list'] })
    },
  })
}
