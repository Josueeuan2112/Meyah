import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Briefcase, Building2, Compass, FileText, User } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'

const NAV_BY_ROLE = {
  candidato: [
    { to: '/inicio',            label: 'Explorar',      icon: Compass   },
    { to: '/mis-postulaciones', label: 'Postulaciones', icon: FileText  },
    { to: '/mi-perfil',         label: 'Perfil',        icon: User      },
  ],
  empleador: [
    { to: '/dashboard',  label: 'Vacantes', icon: Briefcase  },
    { to: '/mi-empresa', label: 'Empresa',  icon: Building2  },
    { to: '/mi-perfil',  label: 'Perfil',   icon: User       },
  ],
} as const

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const items = profile ? NAV_BY_ROLE[profile.tipo] : []

  const handleSignOut = async () => {
    await signOut()
    void navigate('/')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-meyah-crema-50 text-meyah-tinta-900">

      {/* ── Desktop navbar (hidden on mobile) ── */}
      <header className="hidden md:flex sticky top-0 z-30 items-center px-6 h-14 bg-meyah-crema-100 border-b border-meyah-tinta-600/10">

        {/* Wordmark */}
        <Link
          to={items[0]?.to ?? '/inicio'}
          className="font-display text-xl font-semibold text-meyah-jade-700 mr-8 select-none"
        >
          Meyah
        </Link>

        {/* Nav items */}
        <nav className="flex items-center gap-6 flex-1">
          {items.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? 'text-sm font-semibold text-meyah-jade-700'
                  : 'text-sm text-meyah-tinta-600 hover:text-meyah-tinta-900 transition-colors'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-meyah-tinta-600 hover:text-meyah-tinta-900 transition-colors"
        >
          Cerrar sesión
        </button>

      </header>

      {/* ── Main content ── */}
      {/* pb-20 prevents the mobile tab bar from covering the bottom of the page */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile tab bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-meyah-crema-100 border-t border-meyah-tinta-600/10 flex">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 flex-1 transition-colors ${
                isActive ? 'text-meyah-jade-700' : 'text-meyah-tinta-600/70'
              }`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
