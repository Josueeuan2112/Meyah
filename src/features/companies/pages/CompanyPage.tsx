import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'

import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import { useCreateCompany } from '@/features/companies/hooks/useCreateCompany'
import { useUpdateCompany } from '@/features/companies/hooks/useUpdateCompany'
import CompanyForm from '@/features/companies/components/CompanyForm'
import type { CompanyFormValues } from '@/features/companies/schemas/companySchema'

export default function CompanyPage() {
  const navigate = useNavigate()
  const { data: company, isLoading, isError } = useMyCompany()
  const createMutation = useCreateCompany()
  const updateMutation = useUpdateCompany()

  //  Estado: cargando 
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  //  Estado: error 
  if (isError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-muted-foreground">
          No se pudo cargar la información de tu empresa. Intenta de nuevo.
        </p>
      </div>
    )
  }

  //  Estado: resuelto 
  const isEditing = !!company
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: CompanyFormValues) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: company.id, data: values },
        {
          onSuccess: () => toast.success('Empresa actualizada'),
          onError:   () => toast.error('No se pudo actualizar la empresa'),
        }
      )
    } else {
      createMutation.mutate(values, {
        onSuccess: () => { toast.success('Empresa creada'); void navigate('/dashboard') },
        onError:   () => toast.error('No se pudo crear la empresa'),
      })
    }
  }

  return (
    <div className="mx-auto max-w-230 px-4 pt-12 pb-22.5 sm:px-6.5">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>
        <span className="eyebrow">Tu empresa</span>
        <h1 className="mt-2.5 text-[clamp(30px,4vw,40px)]">Perfil de empresa</h1>
        <p className="mt-3 text-[15.5px] text-meyah-tinta-600">
          Tu ubicación define a qué candidatos cercanos llegas.
        </p>

        <CompanyForm
          company={company ?? undefined}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}
