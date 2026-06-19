import { useCallback, useSyncExternalStore } from 'react'

/**
 * Suscribe a un media query y devuelve si coincide, vía useSyncExternalStore
 * (la API idiomática para fuentes externas: sin setState en efectos). Útil para
 * montar UNA sola variante (móvil/desktop) en lugar de ocultar la otra con CSS,
 * evitando montar componentes pesados (mapa, inputs de un form) por duplicado.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    [query],
  )

  const getSnapshot = () => window.matchMedia(query).matches
  // getServerSnapshot: la app es SPA, pero lo proveemos por contrato del API.
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
