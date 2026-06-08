import { Navigate } from 'react-router'

import { useAuth } from '@/features/auth/hooks/useAuth'
import FeedPage from '@/features/jobs/pages/FeedPage'

export default function WelcomePage() {
  const { profile } = useAuth()

  if (!profile) return null
  if (profile.tipo === 'empleador') return <Navigate to="/dashboard" replace />

  return <FeedPage />
}
