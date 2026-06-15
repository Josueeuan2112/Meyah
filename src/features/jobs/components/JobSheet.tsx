import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

import JobDetailView from '@/features/jobs/components/JobDetailView'

interface JobSheetProps {
  jobId: string
  distanciaM?: number | null
  onClose: () => void
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export default function JobSheet({ jobId, distanciaM, onClose }: JobSheetProps) {
  const panelRef = useRef<HTMLElement>(null)

  // Accesibilidad: trap de foco dentro del panel + Escape para cerrar, y al
  // cerrar se devuelve el foco al elemento que lo abrió (sin esto, un usuario de
  // teclado/lector tabula "detrás" del overlay).
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    // Foco inicial dentro del panel (el primer focusable: el botón cerrar)
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end bg-meyah-tinta-900/40 backdrop-blur-[3px] animate-[fadeIn_.2s_forwards]"
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de la vacante"
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
