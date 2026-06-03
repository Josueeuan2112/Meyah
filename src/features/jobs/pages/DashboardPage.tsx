import { Link } from 'react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import { useMyJobs } from '@/features/jobs/hooks/useMyJobs'
import { useCloseJob } from '@/features/jobs/hooks/useCloseJob'
import { useDeleteJob } from '@/features/jobs/hooks/useDeleteJob'
import JobCard from '@/features/jobs/components/JobCard'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export default function DashboardPage() {
  // Todos los hooks antes de cualquier return condicional (reglas de hooks)
  const { data: company, isLoading: companyLoading, isError: companyError } = useMyCompany()
  const { data: jobs, isLoading: jobsLoading, isError: jobsError } = useMyJobs()
  const closeMutation = useCloseJob()
  const deleteMutation = useDeleteJob()

  const handleClose = (id: string) => {
    closeMutation.mutate(id, {
      onSuccess: () => toast.success('Vacante cerrada'),
      onError:   () => toast.error('No se pudo cerrar la vacante'),
    })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Vacante eliminada'),
      onError:   () => toast.error('No se pudo eliminar la vacante'),
    })
  }

  //  Estado 1: empresa cargando
  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  //  Estado 2: error de empresa
  if (companyError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-muted-foreground">
          No se pudo cargar tu información. Intenta de nuevo.
        </p>
      </div>
    )
  }

  //  Estado 3: sin empresa
  // useMyJobs está desactivado sin companyId; evaluar este estado antes de los de jobs
  if (!company) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Primero crea tu empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Necesitas registrar tu empresa antes de publicar vacantes.
            </p>
            <Button asChild>
              <Link to="/mi-empresa">Crear empresa</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  //  Estado 4: empresa lista, vacantes cargando 
  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  //  Estado 5: error de jobs
  if (jobsError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-muted-foreground">
          No se pudieron cargar tus vacantes. Intenta de nuevo.
        </p>
      </div>
    )
  }

  //  Estado 6: resuelto
  const jobList = jobs ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">

      {/* Header siempre presente en el estado resuelto */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-semibold">Mis vacantes</h1>
        <Button asChild>
          <Link to="/dashboard/nueva-vacante">Publicar vacante</Link>
        </Button>
      </div>

      {/* Estado vacío */}
      {jobList.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Aún no has publicado vacantes. Publica la primera.
        </p>
      ) : (
        <div className="space-y-4">
          {jobList.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onClose={handleClose}
              onDelete={handleDelete}
              // Solo la tarjeta cuya vacante está mutando muestra el estado de carga
              isClosing={closeMutation.isPending && closeMutation.variables === job.id}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === job.id}
            />
          ))}
        </div>
      )}

    </div>
  )
}
