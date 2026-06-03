import { Link } from 'react-router'

import type { Job } from '@/shared/types'
import { getCategoryLabel } from '@/features/jobs/schemas/categories'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

interface JobCardProps {
  job: Job
  onClose: (id: string) => void
  onDelete: (id: string) => void
  isClosing?: boolean
  isDeleting?: boolean
}

function formatSalary(amount: number): string {
  return amount.toLocaleString('es-MX')
}

export default function JobCard({ job, onClose, onDelete, isClosing = false, isDeleting = false }: JobCardProps) {
  const fechaPublicacion = new Date(job.created_at).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleDelete = () => {
    if (window.confirm('¿Eliminar esta vacante? Esta acción ocultará la vacante y sus postulaciones.')) {
      onDelete(job.id)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{job.titulo}</CardTitle>

          {/* Badge de estado — sin componente Badge externo */}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
              job.estado === 'abierta'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {job.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Datos de la vacante */}
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{getCategoryLabel(job.categoria)}</p>
          <p className="font-medium text-foreground">
            ${formatSalary(job.salario_min)} – ${formatSalary(job.salario_max)} MXN
          </p>
          <p>Publicada el {fechaPublicacion}</p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/dashboard/vacante/${job.id}/editar`}>Editar</Link>
          </Button>

          {job.estado === 'abierta' && (
            <Button
              variant="outline"
              size="sm"
              disabled={isClosing}
              onClick={() => onClose(job.id)}
            >
              {isClosing ? 'Cerrando...' : 'Cerrar'}
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
