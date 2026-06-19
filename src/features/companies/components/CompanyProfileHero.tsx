import type { ReactNode } from 'react'

import CompanyBanner from '@/features/companies/components/CompanyBanner'
import CompanyLogo from '@/features/companies/components/CompanyLogo'

interface CompanyProfileHeroProps {
  /** Path nuevo del logo (companies.logo_path). */
  logoPath?: string | null
  /** URL legacy del logo (companies.logo_url). */
  legacyUrl?: string | null
  /** Cache-buster: company.updated_at. */
  updatedAt?: string | null
  name: string
  bannerOverlay?: ReactNode
  logoAction?: ReactNode
  /** Bloque de identidad (nombre, badge, categoría/ubicación) bajo el logo. */
  children?: ReactNode
}

// El logo mide h-26 (104px) / sm:h-29 (116px). El padding-top del contenido
// (pt-13 / sm:pt-14.5) es exactamente la mitad de esa altura en cada
// breakpoint, así el logo queda anclado 50% sobre el banner / 50% por debajo
// sin depender del ancho del contenedor ni de valores mágicos por breakpoint.
// Mismo componente para "Editar empresa" y el perfil público del candidato:
// la única diferencia entre vistas son los props (overlay/acción/contenido).
export default function CompanyProfileHero({
  logoPath, legacyUrl, updatedAt, name, bannerOverlay, logoAction, children,
}: CompanyProfileHeroProps) {
  return (
    <div>
      <CompanyBanner overlay={bannerOverlay}>
        <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4 sm:px-6">
          <CompanyLogo
            logoPath={logoPath}
            legacyUrl={legacyUrl}
            name={name}
            updatedAt={updatedAt}
            action={logoAction}
          />
        </div>
      </CompanyBanner>
      <div className="px-4 pt-13 sm:px-6 sm:pt-14.5">
        {children}
      </div>
    </div>
  )
}
