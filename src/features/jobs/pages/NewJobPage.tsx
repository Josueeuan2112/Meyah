import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useCreateJob } from '@/features/jobs/hooks/useCreateJob'
import JobForm from '@/features/jobs/components/JobForm'
import type { JobFormValues } from '@/features/jobs/schemas/jobSchema'

export default function NewJobPage() {
  const navigate = useNavigate()
  const createMutation = useCreateJob()

  const onSubmit = (values: JobFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Vacante publicada')
        void navigate('/dashboard')
      },
      onError: () => toast.error('No se pudo publicar la vacante'),
    })
  }

  return <JobForm onSubmit={onSubmit} isSubmitting={createMutation.isPending} />
}
