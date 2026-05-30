import { Link, useNavigate } from 'react-router'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/ui/button'

export default function Header() {
  const { session, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const firstName = profile?.nombre.split(' ')[0] ?? ''

  return (
    <header className="bg-meyah-crema-50 border-b border-meyah-tinta-600/10">
      <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="font-display text-2xl font-semibold text-meyah-jade-700 hover:text-meyah-jade-900 transition-colors"
        >
          Meyah
        </Link>

        {/* Nav derecha */}
        <nav className="flex items-center gap-2">
          {/* Mientras la sesión se verifica, no renderizamos nada para evitar parpadeo */}
          {!loading && !session && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-meyah-tinta-900 hover:text-meyah-tinta-900 hover:bg-meyah-crema-100"
                asChild
              >
                <Link to="/login">Iniciar sesión</Link>
              </Button>

              <Button
                size="sm"
                className="bg-meyah-jade-500 hover:bg-meyah-jade-700 text-white"
                asChild
              >
                <Link to="/registro">Crear cuenta</Link>
              </Button>
            </>
          )}

          {!loading && session && (
            <>
              <span className="hidden sm:block text-sm text-meyah-tinta-600">
                Hola, <span className="font-medium text-meyah-tinta-900">{firstName}</span>
              </span>

              <Button
                variant="outline"
                size="sm"
                className="border-meyah-terracota-500/40 text-meyah-terracota-700 hover:bg-meyah-terracota-50 hover:text-meyah-terracota-700"
                onClick={handleSignOut}
              >
                Cerrar sesión
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
