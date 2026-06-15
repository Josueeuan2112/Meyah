import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Aísla las librerías pesadas en chunks propios para que el vendor no
        // sea un monolito y el navegador pueda cachearlas por separado entre
        // deploys. recharts y leaflet solo se descargan en las rutas que los
        // usan (gracias al code-splitting por ruta del router). Forma de función
        // (no objeto) porque el tipo de Vite 8 solo acepta ManualChunksFunction.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory')) return 'charts'
          if (id.includes('leaflet')) return 'leaflet' // cubre leaflet y react-leaflet
          if (id.includes('@supabase')) return 'supabase'
          if (
            id.includes('react-router') ||
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('scheduler')
          )
            return 'react-vendor'
        },
      },
    },
  },
})
