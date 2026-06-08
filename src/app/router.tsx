import { createBrowserRouter } from 'react-router'

import RootLayout from '@/shared/components/RootLayout'
import AppLayout from '@/shared/components/AppLayout'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import LandingPage from '@/features/landing/pages/LandingPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import WelcomePage from '@/features/auth/pages/WelcomePage'
import CompanyPage from '@/features/companies/pages/CompanyPage'
import DashboardPage from '@/features/jobs/pages/DashboardPage'
import NewJobPage from '@/features/jobs/pages/NewJobPage'
import EditJobPage from '@/features/jobs/pages/EditJobPage'
import ProfilePage from '@/features/profile/pages/ProfilePage'
import JobDetailPage from '@/features/jobs/pages/JobDetailPage'
import MyApplicationsPage from '@/features/applications/pages/MyApplicationsPage'

export const router = createBrowserRouter([
  // ── Bloque A: rutas públicas con Header/Footer ──────────────────────────
  {
    element: <RootLayout />,
    children: [
      { path: '/',         element: <LandingPage />  },
      { path: '/login',    element: <LoginPage />    },
      { path: '/registro', element: <RegisterPage /> },
    ],
  },

  // ── Bloque B: rutas protegidas con shell de app ──────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/inicio',                         element: <WelcomePage />        },
          { path: '/mi-empresa',                     element: <CompanyPage />        },
          { path: '/mi-perfil',                      element: <ProfilePage />        },
          { path: '/mis-postulaciones',              element: <MyApplicationsPage /> },
          { path: '/vacante/:id',                    element: <JobDetailPage />      },
          { path: '/dashboard',                      element: <DashboardPage />      },
          { path: '/dashboard/nueva-vacante',        element: <NewJobPage />         },
          { path: '/dashboard/vacante/:id/editar',   element: <EditJobPage />        },
        ],
      },
    ],
  },
])
