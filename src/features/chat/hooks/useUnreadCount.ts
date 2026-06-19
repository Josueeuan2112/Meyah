import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useUnreadCount() {
  const { user } = useAuth()

  // Antes este hook abría un canal realtime suscrito a INSERT de TODA la tabla
  // `messages` sin filtro. Montado en AppLayout (persistente), eso despertaba a
  // CADA cliente conectado por cada mensaje de cualquier par de usuarios:
  // fan-out global O(usuarios × mensajes), insostenible a escala.
  //
  // Patrón actual O(usuarios) y predecible:
  //  - refetchInterval de 60s + refetch al enfocar la ventana → cota superior de
  //    60s para que el badge refleje mensajes recibidos en segundo plano.
  //  - Para que el badge baje al INSTANTE cuando el usuario lee o recibe en una
  //    conversación abierta, la invalidación de esta query se dispara desde donde
  //    YA hay realtime filtrado por conversación: useMessages (nuevo mensaje en
  //    el hilo abierto) y useMarkMessagesRead (al marcar leído). Cero fan-out.
  return useQuery({
    queryKey: ['conversations', 'unread', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('unread_messages_count')
      if (error) throw error
      return data ?? 0
    },
    enabled: !!user,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}
