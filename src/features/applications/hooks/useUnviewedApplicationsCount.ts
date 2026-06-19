import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

// Conteo de postulaciones sin revisar (estado 'pendiente'/'vista') de las
// vacantes del empleador, para el badge sobre la tab "Vacantes". La RPC es
// SECURITY DEFINER y filtra por el empleador autenticado, así que solo tiene
// sentido con sesión de empleador.
//
// Mismo patrón que useUnreadCount: refetch cada 60s + al enfocar la ventana,
// sin realtime (evita fan-out). El badge baja como tope a los 60s tras revisar.
export function useUnviewedApplicationsCount() {
  const { user, profile } = useAuth()

  return useQuery({
    queryKey: ['applications', 'unviewed', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('unviewed_applications_count')
      if (error) throw error
      return data ?? 0
    },
    enabled: !!user && profile?.tipo === 'empleador',
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}
