import { Navigate, Outlet } from 'react-router'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserType } from '@/shared/types'

// Guard de navegación por rol (capa UX, no de seguridad — esa vive en RLS).
// Un candidato que cae en /dashboard/* (o un empleador en /inicio) recibe un
// redirect limpio a su home en vez de una pantalla rota/vacía.

const HOME_BY_ROLE: Record<UserType, string> = {
  candidato: '/inicio',
  empleador: '/dashboard',
}

interface RequireRoleProps {
  role: UserType
}

export default function RequireRole({ role }: RequireRoleProps) {
  const { profile } = useAuth()

  // ProtectedRoute (padre) ya resolvió loading/session. profile=null aquí es el
  // instante entre sign-in y la carga de la fila de profiles: no decidir aún —
  // pero con spinner, no con pantalla en blanco (null dejaba un flash vacío
  // justo después del login).
  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-meyah-crema-50">
        <Loader2 className="size-8 animate-spin text-meyah-jade-500" />
      </main>
    )
  }

  if (profile.tipo !== role) {
    return <Navigate to={HOME_BY_ROLE[profile.tipo]} replace />
  }

  return <Outlet />
}
