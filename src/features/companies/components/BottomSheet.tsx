import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Contenido fijo del pie (ej. botones Guardar/Cancelar). */
  footer?: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Bottom-sheet móvil accesible (trap de foco + Escape + scroll lock), espejo del
 * patrón de JobSheet. Se usa para editar cada sección de la empresa en móvil.
 */
export default function BottomSheet({ title, onClose, children, footer }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-meyah-tinta-900/45" style={{ animation: 'fadeIn .22s ease' }} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        className="scroll-fade relative flex max-h-[92dvh] w-full max-w-130 flex-col overflow-hidden rounded-t-[26px] bg-meyah-crema-50 shadow-lg"
        style={{ animation: 'drawerUp .34s cubic-bezier(.2,.8,.2,1)' }}
      >
        <div className="sticky top-0 z-2 border-b border-meyah-border-soft bg-meyah-crema-50 px-4.5 pb-3 pt-2.75">
          <div className="mx-auto mb-2.75 h-1 w-9.5 rounded-full bg-meyah-border" />
          <div className="flex items-center gap-2.5">
            <h3 className="flex-1 text-[19px] text-meyah-jade-900">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="grid size-8 place-items-center rounded-full bg-meyah-crema-100 text-meyah-tinta-600 hover:bg-meyah-border"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="scroll-fade flex-1 overflow-y-auto px-4.5 py-4">{children}</div>

        {footer && (
          <div className="sticky bottom-0 border-t border-meyah-border-soft bg-meyah-crema-50 px-4.5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
