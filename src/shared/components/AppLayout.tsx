import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Briefcase, Building2, Compass, FileText, LogOut, MessageSquare, User } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUnreadCount } from '@/features/chat/hooks/useUnreadCount'

const NAV_BY_ROLE = {
  candidato: [
    { to: '/inicio',            label: 'Explorar',      icon: Compass      },
    { to: '/mis-postulaciones', label: 'Postulaciones', icon: FileText     },
    { to: '/mensajes',          label: 'Mensajes',      icon: MessageSquare },
    { to: '/mi-perfil',         label: 'Perfil',        icon: User         },
  ],
  empleador: [
    { to: '/dashboard',  label: 'Vacantes', icon: Briefcase    },
    { to: '/mensajes',   label: 'Mensajes', icon: MessageSquare },
    { to: '/mi-empresa', label: 'Empresa',  icon: Building2    },
    { to: '/mi-perfil',  label: 'Perfil',   icon: User         },
  ],
} as const

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: unreadCount } = useUnreadCount()

  const items = profile ? NAV_BY_ROLE[profile.tipo] : []

  const handleSignOut = async () => {
    await signOut()
    void navigate('/')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-meyah-crema-50 text-meyah-tinta-900">

      {/* ── Desktop navbar (hidden on mobile) ── */}
      <header className="hidden md:block sticky top-0 z-50 bg-meyah-crema-50/80 backdrop-blur-md border-b border-meyah-border-soft">
        <div className="mx-auto flex h-20 w-full max-w-375 items-center gap-5.5 px-5.5">

          {/* Wordmark + punto terracota */}
          <Link
            to={items[0]?.to ?? '/inicio'}
            className="flex items-baseline gap-0.75 font-display text-[23px] font-semibold tracking-[-0.02em] text-meyah-jade-700 select-none"
          >
            Meyah
            
          </Link>

          {/* Nav items */}
          <nav className="flex items-baseline gap-1">
            {items.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'relative px-3.5 py-2 rounded-full text-[17px] font-semibold text-meyah-jade-700 bg-meyah-jade-50'
                    : 'relative px-3.5 py-2 rounded-full text-[17px] font-medium text-meyah-tinta-600 transition-colors hover:text-meyah-jade-900 hover:bg-meyah-crema-100'
                }
              >
                {label}
                {to === '/mensajes' && !!unreadCount && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-meyah-terracota-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout icon + avatar */}
          <div className="ml-auto flex items-center gap-1">

            {/* Botón logout (ícono) */}
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Cerrar sesión"
              className="grid h-9 w-9 place-items-center rounded-full text-meyah-tinta-400 transition-colors hover:text-meyah-jade-900 hover:bg-meyah-crema-100"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>

            {/* Avatar */}
            <div className="grid h-10 w-10 place-items-center rounded-full border border-meyah-border bg-white text-sm font-semibold text-meyah-jade-700 transition-colors hover:border-meyah-jade-500 select-none">
              {profile?.nombre
                ? profile.nombre.charAt(0).toUpperCase()
                : <User size={18} aria-hidden="true" />
              }
            </div>

          </div>

        </div>
      </header>

      {/* ── Main content ── */}
      {/* pb-20 prevents the mobile tab bar from covering the bottom of the page */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile tab bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-meyah-crema-50/90 backdrop-blur border-t border-meyah-border-soft flex">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2 flex-1 transition-colors ${
                isActive ? 'text-meyah-jade-700' : 'text-meyah-tinta-400'
              }`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
            {to === '/mensajes' && !!unreadCount && unreadCount > 0 && (
              <span className="absolute top-1 right-1/4 grid h-4 min-w-4 place-items-center rounded-full bg-meyah-terracota-500 px-0.5 text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
