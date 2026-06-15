import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface SendMessageInput {
  conversationId: string
  body: string
}

export function useSendMessage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId, body }: SendMessageInput) => {
      if (!user) throw new Error('Sesión no válida')

      const trimmed = body.trim()
      if (trimmed.length === 0 || trimmed.length > 2000) {
        throw new Error('El mensaje debe tener entre 1 y 2000 caracteres')
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: trimmed,
        })

      if (error) throw error
    },
    onSuccess: (_, { conversationId }) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', 'thread', conversationId] })
      void queryClient.invalidateQueries({ queryKey: ['conversations', 'list'] })
    },
  })
}
