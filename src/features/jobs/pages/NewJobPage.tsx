import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { useCreateJob } from '@/features/jobs/hooks/useCreateJob'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import JobForm from '@/features/jobs/components/JobForm'
import type { JobFormValues } from '@/features/jobs/schemas/jobSchema'

export default function NewJobPage() {
  const navigate = useNavigate()
  const createMutation = useCreateJob()
  const { data: company, isLoading: companyLoading } = useMyCompany()

  const onSubmit = (values: JobFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Vacante publicada')
        void navigate('/dashboard')
      },
      onError: () => toast.error('No se pudo publicar la vacante'),
    })
  }

  // Esperar la empresa antes de montar el form: sus defaultValues (incluida la
  // ubicación de partida del mapa) se fijan en el primer render y no se
  // re-evalúan después.
  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const defaultLocation =
    company?.lat != null && company?.lng != null ? { lat: company.lat, lng: company.lng } : null

  return (
    <JobForm
      defaultLocation={defaultLocation}
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending}
    />
  )
}
