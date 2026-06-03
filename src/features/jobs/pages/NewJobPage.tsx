import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useCreateJob } from '@/features/jobs/hooks/useCreateJob'
import JobForm from '@/features/jobs/components/JobForm'
import type { JobFormValues } from '@/features/jobs/schemas/jobSchema'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
      <h1 className="text-2xl font-semibold mb-6">Publicar vacante</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de la vacante</CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm onSubmit={onSubmit} isSubmitting={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  )
}
