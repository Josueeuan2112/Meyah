import { useNavigate, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'

import JobDetailView from '@/features/jobs/components/JobDetailView'
import { Button } from '@/shared/ui/button'

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">Vacante no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-180 px-4 py-10">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft size={16} /> Volver
      </Button>
      <div className="overflow-hidden rounded-panel border border-meyah-border-soft bg-white shadow-sm">
        <JobDetailView jobId={id} />
      </div>
    </div>
  )
}
