import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { Loader2 } from 'lucide-react'

import RootLayout from '@/shared/components/RootLayout'
import AppLayout from '@/shared/components/AppLayout'
import PublicLayout from '@/shared/components/PublicLayout'
import RouteError from '@/shared/components/RouteError'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import RequireRole from '@/features/auth/components/RequireRole'

// Code-splitting por ruta (route.lazy): cada página baja en su propio chunk
// solo cuando se navega a ella, en vez de un bundle monolítico de >1 MB con
// Leaflet incluido desde el landing. En navegaciones cliente, React Router
// mantiene la pantalla actual mientras llega el chunk (sin spinner extra);
// el fallback de hidratación solo aplica a la carga inicial.

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

const hydrateFallback = (
  <main className="flex min-h-screen items-center justify-center bg-meyah-crema-50">
    <Loader2 className="size-8 animate-spin text-meyah-jade-500" />
  </main>
)

export const router = createBrowserRouter([
  // ── Bloque A: rutas públicas con Header/Footer ──────────────────────────
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: hydrateFallback,
    children: [
      { path: '/',            lazy: page(() => import('@/features/landing/pages/LandingPage')) },
      { path: '/login',       lazy: page(() => import('@/features/auth/pages/LoginPage')) },
      { path: '/registro',    lazy: page(() => import('@/features/auth/pages/RegisterPage')) },
      { path: '/recuperar',   lazy: page(() => import('@/features/auth/pages/ForgotPasswordPage')) },
      { path: '/restablecer', lazy: page(() => import('@/features/auth/pages/ResetPasswordPage')) },
    ],
  },

  // ── Bloque público de contenido: vacante + empresa ───────────────────────
  // La RLS deja a `anon` leer vacantes abiertas y empresas públicas, así que
  // estas rutas viven FUERA de ProtectedRoute: un link compartido (WhatsApp,
  // buscadores) abre la página sin pasar por login. Las acciones que requieren
  // sesión (postularse, seguir, mensajear) se gatean dentro de cada página y
  // mandan a /login con retorno. Un usuario logueado las ve igual que antes.
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: hydrateFallback,
    children: [
      { path: '/vacante/:id',  lazy: page(() => import('@/features/jobs/pages/JobDetailPage')) },
      { path: '/empresas/:id', lazy: page(() => import('@/features/companies/pages/PublicCompanyPage')) },
    ],
  },

  // ── Bloque B: rutas protegidas con shell de app ──────────────────────────
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    hydrateFallbackElement: hydrateFallback,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteError />,
        children: [
          // Compartida por ambos roles
          { path: '/mi-perfil', lazy: page(() => import('@/features/profile/pages/ProfilePage')) },
          { path: '/mensajes',  lazy: page(() => import('@/features/chat/pages/ConversationsPage')) },
          { path: '/mensajes/:id', lazy: page(() => import('@/features/chat/pages/ConversationPage')) },

          // Solo candidato — un empleador es redirigido a /dashboard
          {
            element: <RequireRole role="candidato" />,
            children: [
              { path: '/inicio',            lazy: page(() => import('@/features/jobs/pages/FeedPage')) },
              { path: '/mis-postulaciones', lazy: page(() => import('@/features/applications/pages/MyApplicationsPage')) },
            ],
          },

          // Solo empleador — un candidato es redirigido a /inicio
          {
            element: <RequireRole role="empleador" />,
            children: [
              { path: '/mi-empresa',                        lazy: page(() => import('@/features/companies/pages/CompanyPage')) },
              { path: '/dashboard',                         lazy: page(() => import('@/features/jobs/pages/DashboardPage')) },
              { path: '/dashboard/analiticas',              lazy: page(() => import('@/features/analytics/pages/AnalyticsPage')) },
              { path: '/dashboard/nueva-vacante',           lazy: page(() => import('@/features/jobs/pages/NewJobPage')) },
              { path: '/dashboard/vacante/:id/editar',      lazy: page(() => import('@/features/jobs/pages/EditJobPage')) },
              { path: '/dashboard/vacante/:id/postulantes', lazy: page(() => import('@/features/applications/pages/JobApplicantsPage')) },
            ],
          },
        ],
      },
    ],
  },
])
