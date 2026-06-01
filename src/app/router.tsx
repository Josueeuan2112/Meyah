import { createBrowserRouter } from 'react-router'

import RootLayout from '@/shared/components/RootLayout'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import LandingPage from '@/features/landing/pages/LandingPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import WelcomePage from '@/features/auth/pages/WelcomePage'
import CompanyPage from '@/features/companies/pages/CompanyPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // ── Rutas públicas ──────────────────────────────────────────────────────
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
      // ── Rutas protegidas (requieren sesión) ─────────────────────────────────
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/inicio',
            element: <WelcomePage />,
          },
          {
            path: '/mi-empresa',
            element: <CompanyPage />,
          },
        ],
      },
    ],
  },
])
