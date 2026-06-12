import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/shared/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Un throw "pelón" aquí muere ANTES de que React monte → pantalla en blanco
// sin pista alguna (pasó en el primer deploy a Vercel: .env.local está
// gitignoreado y las variables no existían en el proyecto de Vercel).
// Pintamos el error en el DOM con estilos inline (el CSS puede no haber
// cargado aún) para que sea diagnosticable a simple vista, y luego sí
// lanzamos para que conste en consola/Sentry.
function fatalConfigError(varName: string): never {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;background:#FAF5EC;font-family:system-ui,sans-serif;padding:24px;">
        <div style="max-width:420px;background:#fff;border:1px solid #E5DCC9;border-radius:16px;padding:32px;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#147068;">Error de configuración</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#5C5247;">
            Falta la variable de entorno <b>${varName}</b>.
            En Vercel: Settings → Environment Variables, agrégala y vuelve a desplegar
            (las variables VITE_* se incrustan al momento del build).
          </p>
        </div>
      </div>`
  }
  throw new Error(`Missing environment variable: ${varName}`)
}

if (!supabaseUrl) fatalConfigError('VITE_SUPABASE_URL')
if (!supabaseAnonKey) fatalConfigError('VITE_SUPABASE_ANON_KEY')

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
