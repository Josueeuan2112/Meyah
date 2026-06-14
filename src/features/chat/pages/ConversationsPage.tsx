import { Loader2, MessageSquare } from 'lucide-react'

import { useConversations } from '@/features/chat/hooks/useConversations'
import ConversationCard from '@/features/chat/components/ConversationCard'

export default function ConversationsPage() {
  const { data, isPending, isError } = useConversations()

  return (
    <div className="mx-auto max-w-175 px-4 pt-10 pb-22.5 sm:px-6">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>
        <span className="eyebrow">Comunicación</span>
        <h1 className="mt-2.5 text-[clamp(28px,4vw,36px)]">Mensajes</h1>
        <p className="mt-3 text-[15px] text-meyah-tinta-600">
          Conversaciones con candidatos y empleadores.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          {isPending && (
            <div className="flex justify-center py-16">
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <p className="py-10 text-center text-[14px] text-meyah-terracota-700">
              Error al cargar las conversaciones.
            </p>
          )}

          {data && data.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-meyah-crema-100 text-meyah-tinta-400">
                <MessageSquare size={26} />
              </div>
              <p className="text-[15px] text-meyah-tinta-600">
                Aún no tienes conversaciones.
              </p>
              <p className="text-[13px] text-meyah-tinta-400">
                Los empleadores pueden iniciar un chat al revisar postulantes.
              </p>
            </div>
          )}

          {data?.map(c => (
            <ConversationCard key={c.id} conversation={c} />
          ))}
        </div>
      </div>
    </div>
  )
}
