import { Link, Outlet } from 'react-router'

import { useAuth } from '@/features/auth/hooks/useAuth'

// Shell ligero para rutas públicas (vacante / empresa) que un visitante sin
// sesión debe poder abrir desde un link compartido (SEO + WhatsApp). No usa el
// AppLayout (nav de usuario logueado): solo marca + un CTA contextual.
//  - Sin sesión: "Iniciar sesión".
//  - Con sesión: "Volver" a su home (candidato → /inicio, empleador → /dashboard).
export default function PublicLayout() {
  const { session, profile } = useAuth()

  const home = profile?.tipo === 'empleador' ? '/dashboard' : '/inicio'

  return (
    <div className="flex min-h-dvh flex-col bg-meyah-crema-50 text-meyah-tinta-900">
      <header className="sticky top-0 z-50 border-b border-meyah-border-soft bg-meyah-crema-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-270 items-center justify-between px-4 sm:px-7">
          <Link
            to="/"
            className="flex items-baseline gap-0.75 font-display text-[22px] font-semibold tracking-[-0.02em] text-meyah-jade-700 select-none"
          >
            Meyah
            <span className="h-1.5 w-1.5 self-center rounded-full bg-meyah-terracota-500" />
          </Link>

          {session ? (
            <Link
              to={home}
              className="rounded-full bg-meyah-jade-900 px-4.5 py-2.25 text-[13.5px] font-semibold text-white transition hover:bg-meyah-jade-700"
            >
              Ir a Meyah
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="rounded-full px-3.5 py-2.25 text-[13.5px] font-semibold text-meyah-tinta-600 transition hover:text-meyah-jade-900"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="rounded-full bg-meyah-jade-900 px-4.5 py-2.25 text-[13.5px] font-semibold text-white transition hover:bg-meyah-jade-700"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
