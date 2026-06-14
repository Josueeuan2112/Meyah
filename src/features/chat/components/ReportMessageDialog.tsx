import { useState } from 'react'
import { Flag } from 'lucide-react'
import { toast } from 'sonner'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/ui/button'

interface ReportMessageDialogProps {
  messageId: string
  onClose: () => void
}

export default function ReportMessageDialog({ messageId, onClose }: ReportMessageDialogProps) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    if (!user || !reason.trim()) return
    setSending(true)
    const { error } = await supabase
      .from('message_reports')
      .insert({ message_id: messageId, reporter_id: user.id, reason: reason.trim() })

    if (error) {
      if (error.code === '23505') toast.info('Ya reportaste este mensaje.')
      else toast.error('No se pudo enviar el reporte.')
    } else {
      toast.success('Reporte enviado. Revisaremos este mensaje.')
    }
    setSending(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-meyah-border-soft bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2.5">
          <Flag size={18} className="text-meyah-terracota-500" />
          <h3 className="font-display text-[18px] font-semibold text-meyah-tinta-900">
            Reportar mensaje
          </h3>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="¿Por qué quieres reportar este mensaje?"
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
            disabled={!reason.trim() || sending}
            onClick={handleSubmit}
          >
            {sending ? 'Enviando…' : 'Enviar reporte'}
          </Button>
        </div>
      </div>
    </div>
  )
}
