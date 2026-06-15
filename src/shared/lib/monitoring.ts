import * as Sentry from '@sentry/react'

// Monitoreo de errores. Sentry se activa SOLO si VITE_SENTRY_DSN está definido;
// sin DSN todo es no-op silencioso (reportError cae a console.error). Así el
// repo funciona sin cuenta de Sentry y producción puede activarlo con una env
// var, sin tocar código.

const dsn = import.meta.env.VITE_SENTRY_DSN
let active = false

export function initMonitoring(): void {
  // Sin DSN: no inicializar. No-op silencioso (no contamina la consola en dev).
  if (!dsn) return

  Sentry.init({
    dsn,
    // El entorno permite distinguir errores de prod vs. previews en Sentry.
    environment: import.meta.env.MODE,
    // Sin performance/replay en MVP: solo captura de errores, lo mínimo útil.
    tracesSampleRate: 0,
  })
  active = true
}

// Reporta un error a Sentry si está activo; si no, lo manda a console.error.
// `context` es metadata NO sensible (nunca passwords, tokens ni emails).
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (active) {
    Sentry.captureException(error, context ? { extra: context } : undefined)
    return
  }
  // Fallback sin Sentry. Server-side-safe: no se loguean datos sensibles porque
  // el llamador no los pasa en `context`.
  console.error('[meyah]', error, context ?? '')
}
