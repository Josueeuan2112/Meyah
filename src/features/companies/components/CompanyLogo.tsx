import type { ReactNode } from 'react'

import Avatar from '@/shared/components/Avatar'
import { COMPANY_LOGOS_BUCKET } from '@/features/companies/hooks/useUploadCompanyLogo'
import { cn } from '@/shared/lib/utils'

interface CompanyLogoProps {
  /** Path nuevo en Storage (companies.logo_path). */
  logoPath?: string | null
  /** URL legacy (companies.logo_url). */
  legacyUrl?: string | null
  name: string
  /** Cache-buster: company.updated_at. */
  updatedAt?: string | null
  /** Acción superpuesta en la esquina del logo (ej. botón de cámara). */
  action?: ReactNode
  className?: string
}

// El frame blanco redondeado es identidad de marca del logo de empresa; el
// fallback imagen-vs-iniciales lo resuelve <Avatar> (fuente única de verdad).
export default function CompanyLogo({ logoPath, legacyUrl, name, updatedAt, action, className }: CompanyLogoProps) {
  return (
    <div className={cn('relative h-26 w-26 sm:h-29 sm:w-29', className)}>
      <div className="grid h-full w-full place-items-center rounded-3xl border-[5px] border-white bg-white shadow-lg">
        <Avatar
          path={logoPath}
          legacyUrl={legacyUrl}
          bucket={COMPANY_LOGOS_BUCKET}
          name={name}
          tone="terracota"
          shape="rounded"
          updatedAt={updatedAt}
          className="rounded-[19px] text-[34px]"
        />
      </div>
      {action}
    </div>
  )
}
