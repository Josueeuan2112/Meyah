import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export interface ConversationSummary {
  id: string
  job_id: string
  candidato_id: string
  empleador_id: string
  created_at: string
  job_titulo: string
  company_nombre: string
  other_name: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

export function useConversations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['conversations', 'list', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_conversations')
      if (error) throw error
      return data as ConversationSummary[]
    },
    enabled: !!user,
  })
}
