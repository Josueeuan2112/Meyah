import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

function myConversationsQuery() {
  return supabase.rpc('my_conversations')
}

export type ConversationSummary = NonNullable<
  Awaited<ReturnType<typeof myConversationsQuery>>['data']
>[number]

export function useConversations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['conversations', 'list', user?.id],
    queryFn: async () => {
      const { data, error } = await myConversationsQuery()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}
