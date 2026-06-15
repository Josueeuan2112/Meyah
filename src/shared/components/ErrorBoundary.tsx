import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { reportError } from '@/shared/lib/monitoring'

// ÚNICA excepción válida a la regla "solo functional components": React no
// expone los error boundaries como hook. componentDidCatch / getDerivedStateFromError
// solo existen en componentes de clase, así que este boundary global DEBE ser
// una clase. Captura errores de render del árbol y evita la pantalla en blanco.

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Reporta a Sentry (si está activo) o a console.error. componentStack es
    // metadata NO sensible: la cadena de componentes donde reventó el render.
    reportError(error, { componentStack: info.componentStack })
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-meyah-crema-50 px-6 py-10 text-center">
        <div className="w-full max-w-[420px]">
          <span className="font-display text-[26px] font-semibold text-meyah-jade-900">
            Meyah
            <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-meyah-terracota-500 align-middle" />
          </span>

          <h1 className="mt-6 font-display text-[28px] leading-tight text-meyah-tinta-900">
            Algo salió mal
          </h1>
          <p className="mt-3 text-[14.5px] leading-[1.6] text-meyah-tinta-600">
            Ocurrió un error inesperado. Vuelve a cargar la página; si el problema
            continúa, intenta más tarde.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 w-full items-center justify-center rounded-field bg-meyah-jade-700 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-meyah-jade-900"
            >
              Recargar
            </button>
            <a
              href="/"
              className="text-[14px] font-semibold text-meyah-jade-700 transition-colors hover:text-meyah-jade-900"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </main>
    )
  }
}
