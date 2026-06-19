import { Loader2 } from 'lucide-react'

import { toast } from 'sonner'
import { useNavigate } from 'react-router'

import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import { useCreateCompany } from '@/features/companies/hooks/useCreateCompany'
import CompanyForm from '@/features/companies/components/CompanyForm'
import CompanyEditor from '@/features/companies/components/CompanyEditor'
import type { CompanyFormValues } from '@/features/companies/schemas/companySchema'

export default function CompanyPage() {
  const navigate = useNavigate()
  const { data: company, isLoading, isError } = useMyCompany()
  const createMutation = useCreateCompany()

  // Estado: cargando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Estado: error
  if (isError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-muted-foreground">
          No se pudo cargar la información de tu empresa. Intenta de nuevo.
        </p>
      </div>
    )
  }

  // Empresa existente → editor enriquecido (móvil con sheets + desktop 2 columnas)
  if (company) {
    return (
      <div className="mx-auto max-w-285 px-4 pt-8 pb-24 sm:px-6" style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>
        <div className="mb-5">
          <span className="eyebrow">Tu empresa</span>
          <h1 className="mt-2 text-[clamp(26px,3.5vw,34px)]">Editar empresa</h1>
          <p className="mt-2 text-[14.5px] text-meyah-tinta-600">
            Lo que configuras aquí es lo que ven los candidatos en tu perfil público.
          </p>
        </div>
        <CompanyEditor company={company} />
      </div>
    )
  }

  // Sin empresa aún → flujo de creación
  const onCreate = (values: CompanyFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => { toast.success('Empresa creada'); void navigate('/mi-empresa') },
      onError:   () => toast.error('No se pudo crear la empresa'),
    })
  }

  return (
    <div className="mx-auto max-w-230 px-4 pt-12 pb-22.5 sm:px-6.5">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>
        <span className="eyebrow">Tu empresa</span>
        <h1 className="mt-2.5 text-[clamp(30px,4vw,40px)]">Crea tu empresa</h1>
        <p className="mt-3 text-[15.5px] text-meyah-tinta-600">
          Empieza con lo básico. Después podrás enriquecer tu perfil público.
        </p>

        <CompanyForm
          onSubmit={onCreate}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  )
}
