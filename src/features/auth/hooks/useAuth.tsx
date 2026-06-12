import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { supabase } from '@/shared/lib/supabase'
import type { Profile, UserType } from '@/shared/types'
import type { JobCategoryValue, JobScheduleValue } from '@/features/jobs/schemas/categories'

// Tipos

interface SignUpParams {
  email: string
  password: string
  nombre: string
  tipo: UserType
  phone: string
  lat_referencia?: number | null
  lng_referencia?: number | null
  radio_busqueda_km?: number | null
  categorias_interes?: JobCategoryValue[] | null
  disponibilidad?: JobScheduleValue | null
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (params: SignUpParams) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  reloadProfile: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>
}

//ontext 

const AuthContext = createContext<AuthContextValue | null>(null)

//Provider 

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // loading=true hasta que sepamos si hay sesión activa o no
  const [loading, setLoading] = useState(true)

  // signOut deliberado (botón) vs. sesión que muere sola (refresh token
  // inválido/expirado): solo el segundo caso merece el aviso "sesión expirada"
  const intentionalSignOutRef = useRef(false)
  const hadSessionRef = useRef(false)

  // Única función de carga de profile (antes estaba duplicada aquí y en
  // reloadProfile). maybeSingle en vez de single: distingue "0 filas" (cuenta
  // eliminada) de un error transitorio de red/RLS.
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // Error transitorio: conservar el profile previo (si lo hay) y no
      // cerrar sesión — el siguiente evento de auth o reload reintenta
      return
    }

    if (!data) {
      // Sesión válida pero SIN fila en profiles: usuario eliminado/inhabilitado
      // con sesión cacheada. Antes esto dejaba la app en spinner infinito;
      // ahora se cierra la sesión con un mensaje claro.
      intentionalSignOutRef.current = true
      await supabase.auth.signOut()
      toast.error('Tu cuenta ya no está disponible.')
      return
    }

    setProfile(data)
  }, [])

  useEffect(() => {
    // Restauración automática: lee la sesión persistida en localStorage al
    // montar (recarga de página / reapertura del navegador).
    void supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current)
      setUser(current?.user ?? null)
      hadSessionRef.current = !!current

      if (current?.user) {
        // Espera a que el profile cargue antes de quitar el loading inicial,
        // así la UI no parpadea con profile=null por un instante
        void fetchProfile(current.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // INITIAL_SESSION ya lo cubrió getSession() arriba: procesarlo aquí
      // duplicaba la query de profiles en cada arranque
      if (event === 'INITIAL_SESSION') return

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        hadSessionRef.current = true
        // El profile solo cambia de identidad en SIGNED_IN / PASSWORD_RECOVERY.
        // En TOKEN_REFRESHED (~cada hora) y USER_UPDATED recargarlo era una
        // query innecesaria.
        if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
          // setTimeout(0): regla documentada de supabase-js — llamar a la API
          // DENTRO del callback de onAuthStateChange puede deadlockear (el
          // callback corre sosteniendo el navigator lock del cliente).
          const userId = newSession.user.id
          setTimeout(() => void fetchProfile(userId), 0)
        }
      } else {
        setProfile(null)

        if (event === 'SIGNED_OUT') {
          // Logout limpio: purgar la caché de TanStack. Sin esto, otro usuario
          // en el mismo dispositivo podía ver datos cacheados del anterior
          // (p.ej. ['jobs','mine','proximity'] no está keyado por usuario).
          queryClient.clear()

          if (hadSessionRef.current && !intentionalSignOutRef.current) {
            toast.error('Tu sesión expiró. Vuelve a iniciar sesión.')
          }
          intentionalSignOutRef.current = false
          hadSessionRef.current = false
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, queryClient])

  const reloadProfile = useCallback(async () => {
    if (!user) return
    await fetchProfile(user.id)
  }, [user, fetchProfile])

  async function signUp({
    email,
    password,
    nombre,
    tipo,
    phone,
    lat_referencia,
    lng_referencia,
    radio_busqueda_km,
    categorias_interes,
    disponibilidad,
  }: SignUpParams): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Tras confirmar el correo, Supabase redirige aquí (debe estar en
        // Auth → URL Configuration → Redirect URLs del dashboard)
        emailRedirectTo: `${window.location.origin}/login`,
        // El trigger handle_new_user en Supabase lee raw_user_meta_data
        // para crear el registro inicial en profiles con nombre, tipo, phone,
        // ubicación de referencia y preferencias de búsqueda (candidatos)
        data: {
          nombre,
          tipo,
          phone,
          lat_referencia,
          lng_referencia,
          radio_busqueda_km,
          categorias_interes,
          disponibilidad,
        },
      },
    })
    return { error }
  }

  async function signIn(
    email: string,
    password: string,
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut(): Promise<void> {
    // Marca de logout deliberado: el handler de SIGNED_OUT no debe mostrar
    // el aviso de "sesión expirada" cuando fue el usuario quien salió
    intentionalSignOutRef.current = true
    await supabase.auth.signOut()
    // onAuthStateChange dispara SIGNED_OUT y limpia session, user y profile
  }

  // Envía el correo de recuperación. El enlace abre /restablecer con la sesión
  // de recuperación; la Redirect URL debe estar registrada en el dashboard.
  async function resetPassword(email: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer`,
    })
    return { error }
  }

  // Cambia la contraseña del usuario con sesión activa (la de recuperación
  // que dejó el enlace del correo, o una sesión normal).
  async function updatePassword(password: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  // Reenvía el correo de confirmación de cuenta (signup).
  async function resendConfirmation(email: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        reloadProfile,
        resetPassword,
        updatePassword,
        resendConfirmation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

//  Hook 

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return context
}
