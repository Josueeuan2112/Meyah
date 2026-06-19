import { useEffect, useRef, useState } from 'react'
import { Flag } from 'lucide-react'
import { toast } from 'sonner'

import { useReportCompany } from '@/features/companies/hooks/useCompanySocial'
import { Button } from '@/shared/ui/button'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'

interface ReportCompanyDialogProps {
  companyId: string
  onClose: () => void
}

export default function ReportCompanyDialog({ companyId, onClose }: ReportCompanyDialogProps) {
  const [reason, setReason] = useState('')
  const report = useReportCompany(companyId)
  const panelRef = useRef<HTMLDivElement>(null)

  // Trap de foco + Escape global + scroll lock + restauración (espejo de
  // BottomSheet). Antes el Escape vivía en onKeyDown del overlay (frágil).
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

    const prevOverflow = document.body.style.overflow
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  const handleSubmit = () => {
    if (!reason.trim()) return
    report.mutate(reason, {
      onSuccess: () => {
        toast.success('Reporte enviado. Gracias por avisar.')
        onClose()
      },
      onError: err => {
        const code = (err as { code?: string }).code
        if (code === '23505') {
          toast.info('Ya reportaste esta empresa.')
          onClose()
        } else {
          toast.error('No se pudo enviar el reporte.')
        }
      },
    })
  }

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-company-title"
        className="w-full max-w-sm rounded-2xl border border-meyah-border-soft bg-white p-6 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <Flag size={18} className="text-meyah-terracota-500" />
          <h3 id="report-company-title" className="font-display text-[18px] font-semibold text-meyah-tinta-900">
            Reportar empresa
          </h3>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="¿Por qué quieres reportar esta empresa?"
          aria-label="Motivo del reporte"
          maxLength={500}
          rows={3}
          className="w-full resize-none rounded-xl border border-meyah-border bg-meyah-crema-50 px-3.5 py-2.5 text-[14px] text-meyah-tinta-900 outline-none placeholder:text-meyah-tinta-400 focus:border-meyah-jade-500"
        />
        <div className="mt-4 flex gap-2.5">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={!reason.trim() || report.isPending}
            onClick={handleSubmit}
          >
            {report.isPending ? 'Enviando…' : 'Enviar reporte'}
          </Button>
        </div>
      </div>
    </div>
  )
}
