import { createBrowserRouter, Link } from 'react-router'

import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import WelcomePage from '@/features/auth/pages/WelcomePage'

function LandingPage() {
  return (
    <main className="min-h-screen bg-meyah-crema-50 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-meyah-jade-700">Landing Page - Meyah</h1>
      <Link
        to="/login"
        className="text-meyah-jade-700 underline hover:text-meyah-jade-900 transition-colors"
      >
        Ir a Login
      </Link>
    </main>
  )
}

export const router = createBrowserRouter([
  // ── Rutas públicas ────────────────────────────────────────────────────────
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/registro',
    element: <RegisterPage />,
  },
  // ── Rutas protegidas (requieren sesión) ───────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/inicio',
        element: <WelcomePage />,
      },
    ],
  },
])
