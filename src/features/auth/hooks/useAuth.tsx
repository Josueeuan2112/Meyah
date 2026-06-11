import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/shared/lib/supabase'
import type { Profile, UserType } from '@/shared/types'

// Tipos

interface SignUpParams {
  email: string
  password: string
  nombre: string
  tipo: UserType
  phone: string
  lat_referencia?: number | null
  lng_referencia?: number | null
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
}

//ontext 

const AuthContext = createContext<AuthContextValue | null>(null)

//Provider 

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // loading=true hasta que sepamos si hay sesión activa o no
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carga el profile desde la tabla profiles dado un user id.
    // Usa .single() que devuelve null (no lanza error) si no encuentra la fila,
    // lo cual cubre el caso donde el trigger aún no insertó el registro.
    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    }

    // Verifica si ya hay sesión persistida (cookie/localStorage) al montar.
    // Cubre el caso de recarga de página con sesión vigente.
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current)
      setUser(current?.user ?? null)

      if (current?.user) {
        // Espera a que el profile cargue antes de quitar el loading inicial,
        // así la UI no parpadea con profile=null por un instante
        loadProfile(current.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Reacciona a todos los eventos de auth: LOGIN, LOGOUT, TOKEN_REFRESHED, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        // void: el Promise se maneja internamente; no afecta el loading
        // porque la sesión inicial ya lo resolvió en getSession arriba
        void loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const reloadProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
  }, [user])

  async function signUp({
    email,
    password,
    nombre,
    tipo,
    phone,
    lat_referencia,
    lng_referencia,
  }: SignUpParams): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // El trigger handle_new_user en Supabase lee raw_user_meta_data
        // para crear el registro inicial en profiles con nombre, tipo,
        // phone y ubicación de referencia (candidatos)
        data: { nombre, tipo, phone, lat_referencia, lng_referencia },
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
    await supabase.auth.signOut()
    // onAuthStateChange dispara SIGNED_OUT y limpia session, user y profile
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signUp, signIn, signOut, reloadProfile }}
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
