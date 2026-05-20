import { createBrowserRouter, Link } from 'react-router'

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

function LoginPage() {
  return (
    <main className="min-h-screen bg-meyah-crema-50 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-meyah-jade-700">Login - Meyah</h1>
      <Link
        to="/"
        className="text-meyah-tinta-600 underline hover:text-meyah-tinta-900 transition-colors"
      >
        ← Volver al inicio
      </Link>
    </main>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
])
