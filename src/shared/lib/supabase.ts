import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/shared/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY')
}

// Configuración de auth EXPLÍCITA (auditoría): son los defaults de
// supabase-js v2, pero dejarlos escritos evita que un upgrade o un copy-paste
// los cambie en silencio. Juntos cubren el ciclo completo de sesión:
//   persistSession     → la sesión vive en localStorage y sobrevive cerrar el
//                        navegador; al volver, getSession() la restaura.
//   autoRefreshToken   → el access token (JWT, ~1 h) se renueva solo con el
//                        refresh token antes de expirar; sin cierres inesperados.
//   detectSessionInUrl → procesa los tokens que llegan en la URL desde los
//                        enlaces de correo (confirmación y recuperación).
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
