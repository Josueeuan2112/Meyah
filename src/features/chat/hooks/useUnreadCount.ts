import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useUnreadCount() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['conversations', 'unread', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('unread_messages_count')
      if (error) throw error
      return data ?? 0
    },
    enabled: !!user,
    // Sin polling: la suscripción realtime de abajo invalida el contador cuando
    // llega un mensaje nuevo. El refetchInterval de 60s era redundante (y a escala
    // multiplicaba la carga del RPC). Follow-up de escala documentado: filtrar el
    // canal realtime por las conversaciones del usuario en vez de toda la tabla.
  })

  // Listen for any new messages to refresh the count
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('unread-badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['conversations', 'unread'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  return query
}
