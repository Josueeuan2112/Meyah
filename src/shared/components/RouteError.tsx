import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError, Link } from 'react-router'

import { reportError } from '@/shared/lib/monitoring'

// errorElement de React Router: captura errores de carga de chunks lazy,
// loaders y throws durante la navegación (lo que el ErrorBoundary de render
// no ve). Distingue un 404 (ruta no encontrada) de un error genérico.

export default function RouteError() {
  const error = useRouteError()

  const notFound = isRouteErrorResponse(error) && error.status === 404

  useEffect(() => {
    // No reportar los 404 (no son fallos de la app, solo URLs inexistentes).
    if (!notFound) reportError(error)
  }, [error, notFound])

  const title = notFound ? 'Página no encontrada' : 'Algo salió mal'
  const message = notFound
    ? 'La página que buscas no existe o se movió de lugar.'
    : 'No se pudo cargar esta sección. Vuelve a intentarlo.'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-meyah-crema-50 px-6 py-10 text-center">
      <div className="w-full max-w-[420px]">
        <span className="font-display text-[26px] font-semibold text-meyah-jade-900">
          Meyah
          <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-meyah-terracota-500 align-middle" />
        </span>

        {notFound && (
          <p className="mt-6 font-display text-[60px] font-semibold leading-none text-meyah-jade-700">
            404
          </p>
        )}

        <h1 className="mt-6 font-display text-[28px] leading-tight text-meyah-tinta-900">
          {title}
        </h1>
        <p className="mt-3 text-[14.5px] leading-[1.6] text-meyah-tinta-600">{message}</p>

        <div className="mt-7 flex flex-col items-center gap-3">
          {!notFound && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 w-full items-center justify-center rounded-field bg-meyah-jade-700 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-meyah-jade-900"
            >
              Recargar
            </button>
          )}
          <Link
            to="/"
            className="text-[14px] font-semibold text-meyah-jade-700 transition-colors hover:text-meyah-jade-900"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
