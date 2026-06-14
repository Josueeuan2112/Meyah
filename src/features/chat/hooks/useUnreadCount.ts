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
      return (data as number) ?? 0
    },
    enabled: !!user,
    refetchInterval: 60_000,
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
