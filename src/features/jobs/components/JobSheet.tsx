import { useEffect } from 'react'
import { X } from 'lucide-react'

import JobDetailView from '@/features/jobs/components/JobDetailView'

interface JobSheetProps {
  jobId: string
  distanciaM?: number | null
  onClose: () => void
}

export default function JobSheet({ jobId, distanciaM, onClose }: JobSheetProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end bg-meyah-tinta-900/40 backdrop-blur-[3px] animate-[fadeIn_.2s_forwards]"
      onClick={onClose}
    >
      <aside
        onClick={e => e.stopPropagation()}
        className="relative flex h-full w-[min(440px,100%)] flex-col overflow-y-auto bg-meyah-crema-50 shadow-lg animate-[sheetIn_.32s_cubic-bezier(.2,.7,.3,1)_forwards]"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-3 grid h-9.5 w-9.5 place-items-center rounded-full bg-white/85 text-meyah-tinta-900 shadow-xs hover:bg-white"
        >
          <X size={20} />
        </button>
        <JobDetailView jobId={jobId} distanciaM={distanciaM} />
      </aside>
    </div>
  )
}
