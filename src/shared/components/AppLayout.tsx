import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { BarChart3, Briefcase, Building2, Compass, FileText, LogOut, MessageSquare, User } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUnreadCount } from '@/features/chat/hooks/useUnreadCount'
import { useUnviewedApplicationsCount } from '@/features/applications/hooks/useUnviewedApplicationsCount'
import Avatar from '@/shared/components/Avatar'
import { AVATARS_BUCKET } from '@/features/profile/hooks/useUploadAvatar'

const NAV_BY_ROLE = {
  candidato: [
    { to: '/inicio',            label: 'Explorar',      icon: Compass      },
    { to: '/mis-postulaciones', label: 'Postulaciones', icon: FileText     },
    { to: '/mensajes',          label: 'Mensajes',      icon: MessageSquare },
    { to: '/mi-perfil',         label: 'Perfil',        icon: User         },
  ],
  empleador: [
    { to: '/dashboard',             label: 'Vacantes',    icon: Briefcase     },
    { to: '/dashboard/analiticas',  label: 'Analíticas',  icon: BarChart3     },
    { to: '/mensajes',              label: 'Mensajes',    icon: MessageSquare },
    { to: '/mi-empresa',            label: 'Empresa',     icon: Building2     },
    { to: '/mi-perfil',             label: 'Perfil',      icon: User          },
  ],
} as const

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: unreadCount } = useUnreadCount()
  const { data: unviewedApplications } = useUnviewedApplicationsCount()

  const items = profile ? NAV_BY_ROLE[profile.tipo] : []

  // Badge sobre la tab "Vacantes" (solo empleador): postulaciones sin revisar.
  // El hook ya se desactiva para candidatos, pero gateamos también el render.
  const badgeFor = (to: string): number | undefined => {
    if (to === '/mensajes' && unreadCount) return unreadCount
    if (to === '/dashboard' && profile?.tipo === 'empleador' && unviewedApplications) {
      return unviewedApplications
    }
    return undefined
  }

  const handleSignOut = async () => {
    await signOut()
    void navigate('/')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-meyah-crema-50 text-meyah-tinta-900">

      {/* Skip-link: primer elemento enfocable, salta directo al contenido */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-meyah-jade-700 focus:px-4 focus:py-2 focus:text-[14px] focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      {/* ── Desktop navbar (hidden on mobile) ── */}
      <header className="hidden md:block sticky top-0 z-50 bg-meyah-crema-50 border-b border-meyah-border-soft">
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
            {items.map(({ to, label }) => {
              const badge = badgeFor(to)
              return (
                <NavLink
                  key={to}
                  to={to}
                  end
                  className={({ isActive }) =>
                    isActive
                      ? 'relative px-3.5 py-2 rounded-full text-[17px] font-semibold text-meyah-jade-700 bg-meyah-jade-50'
                      : 'relative px-3.5 py-2 rounded-full text-[17px] font-medium text-meyah-tinta-600 transition-colors hover:text-meyah-jade-900 hover:bg-meyah-crema-100'
                  }
                >
                  {label}
                  {!!badge && (
                    <span className="absolute -top-0.5 -right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-meyah-terracota-500 px-1 text-[10px] font-bold text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
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

            {/* Avatar (misma fuente única de fallback que el resto de la app) */}
            {profile?.nombre
              ? (
                <Avatar
                  path={profile.avatar_path}
                  legacyUrl={profile.avatar_url}
                  bucket={AVATARS_BUCKET}
                  name={profile.nombre}
                  updatedAt={profile.updated_at}
                  size={40}
                  className="border border-meyah-border transition-colors hover:border-meyah-jade-500"
                />
              )
              : (
                <div className="grid h-10 w-10 place-items-center rounded-full border border-meyah-border bg-white text-meyah-jade-700 select-none">
                  <User size={18} aria-hidden="true" />
                </div>
              )}

          </div>

        </div>
      </header>

      {/* ── Main content ── */}
      {/* pb-20 prevents the mobile tab bar from covering the bottom of the page */}
      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile tab bar (hidden on desktop) ── */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-meyah-crema-50 border-t border-meyah-border-soft flex">
        {items.map(({ to, label, icon: Icon }) => {
          const badge = badgeFor(to)
          return (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2 flex-1 transition-colors ${
                  isActive ? 'text-meyah-jade-700' : 'text-meyah-tinta-400'
                }`
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {!!badge && (
                <span className="absolute top-1 right-1/4 grid h-4 min-w-4 place-items-center rounded-full bg-meyah-terracota-500 px-0.5 text-[9px] font-bold text-white">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

    </div>
  )
}
