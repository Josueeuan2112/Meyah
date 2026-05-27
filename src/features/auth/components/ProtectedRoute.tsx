import { Navigate, Outlet } from 'react-router'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  // 1. Auth state still resolving — show spinner before making any redirect decision
  if (loading) {
    return (
      <main className="min-h-screen bg-meyah-crema-50 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-meyah-jade-500" />
      </main>
    )
  }

  // 2. Auth resolved, no session — send to login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // 3. Auth resolved, session exists — render the protected child routes
  return <Outlet />
}
