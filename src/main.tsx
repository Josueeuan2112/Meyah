import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import './styles/globals.css'
// El CSS de Leaflet ya NO se importa aquí: vivía en el bundle global y penalizaba
// el landing/login (que no usan mapa). Ahora cada componente que monta un mapa
// (FeedMap, LocationPicker, ZonePicker) lo importa por su cuenta; Vite deduplica.

import ErrorBoundary from './shared/components/ErrorBoundary'
import { initMonitoring } from './shared/lib/monitoring'
import Providers from './app/providers'
import { router } from './app/router'

// Inicializa el monitoreo antes del render para capturar errores tempranos.
initMonitoring()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ErrorBoundary por FUERA de Providers: así también captura errores que
        revienten dentro de los propios providers (p. ej. AuthProvider). */}
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
)
