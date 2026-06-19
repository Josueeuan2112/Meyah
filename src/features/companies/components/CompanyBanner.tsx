import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

interface CompanyBannerProps {
  /** Botones superpuestos en la franja superior (volver, editar portada). */
  overlay?: ReactNode
  /** Contenido posicionado libremente sobre el borde inferior (el logo). */
  children?: ReactNode
  className?: string
}

// Sin overflow-hidden propio: el logo (children) necesita sobresalir del
// borde inferior del banner. El recorte del patrón greca vive en la capa
// decorativa interna, no en este contenedor — así el logo nunca se clippea.
export default function CompanyBanner({ overlay, children, className }: CompanyBannerProps) {
  return (
    <div className={cn('relative h-37 sm:h-47', className)}>
      <div className="greca absolute inset-0 overflow-hidden rounded-panel bg-meyah-jade-50">
        <div className="absolute inset-0 bg-[linear-gradient(165deg,transparent_45%,rgba(10,61,56,0.16))]" />
      </div>
      {overlay && (
        <div className="absolute inset-x-0 top-3 flex items-center justify-between gap-2 px-3 sm:top-4 sm:px-6">
          {overlay}
        </div>
      )}
      {children}
    </div>
  )
}
