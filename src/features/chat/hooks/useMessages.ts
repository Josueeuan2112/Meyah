import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Message } from '@/shared/types'

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', 'thread', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Message[]
    },
    enabled: !!conversationId && !!user,
  })

  // Realtime subscription for new messages in this conversation
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['messages', 'thread', conversationId] })
          void queryClient.invalidateQueries({ queryKey: ['conversations', 'list'] })
          // Este canal está filtrado por conversation_id (O(usuarios), sin fan-out
          // global). Invalidar aquí el contador de no-leídos hace que el badge
          // reaccione al instante en la conversación abierta, sustituyendo a la
          // antigua suscripción global de useUnreadCount.
          void queryClient.invalidateQueries({ queryKey: ['conversations', 'unread'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])

  return query
}
