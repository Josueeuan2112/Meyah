import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import 'leaflet/dist/leaflet.css'
import './styles/globals.css'

import Providers from './app/providers'
import { router } from './app/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
