import { Link, useNavigate, useParams } from 'react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useJob } from '@/features/jobs/hooks/useJob'
import { useUpdateJob } from '@/features/jobs/hooks/useUpdateJob'
import JobForm from '@/features/jobs/components/JobForm'
import type { JobFormValues } from '@/features/jobs/schemas/jobSchema'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export default function EditJobPage() {
  // Todos los hooks antes de cualquier return condicional (regla de hooks)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: job, isLoading, isError } = useJob(id)
  const updateMutation = useUpdateJob()

  const onSubmit = (values: JobFormValues) => {
    if (!id) return
    updateMutation.mutate({ id, data: values }, {
      onSuccess: () => {
        toast.success('Vacante actualizada')
        void navigate('/dashboard')
      },
      onError: () => toast.error('No se pudo actualizar la vacante'),
    })
  }

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
          No se pudo cargar la vacante. Intenta de nuevo.
        </p>
      </div>
    )
  }

  //  Estado: vacante no encontrada 
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-center text-muted-foreground">Vacante no encontrada.</p>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    )
  }

  //  Estado: resuelto 
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
      <h1 className="text-2xl font-semibold mb-6">Editar vacante</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{job.titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm job={job} onSubmit={onSubmit} isSubmitting={updateMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  )
}
