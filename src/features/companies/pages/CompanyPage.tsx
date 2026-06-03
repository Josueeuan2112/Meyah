import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'

import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import { useCreateCompany } from '@/features/companies/hooks/useCreateCompany'
import { useUpdateCompany } from '@/features/companies/hooks/useUpdateCompany'
import CompanyForm from '@/features/companies/components/CompanyForm'
import type { CompanyFormValues } from '@/features/companies/schemas/companySchema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

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
    <div className="px-4 py-10 md:py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEditing ? 'Editar empresa' : 'Crea tu empresa'}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Actualiza la información de tu empresa.'
                : 'Registra los datos de tu empresa para empezar a publicar vacantes.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <CompanyForm
              company={company ?? undefined}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
