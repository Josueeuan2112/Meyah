import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router'
import { ArrowLeft, Loader2, Flag } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMessages } from '@/features/chat/hooks/useMessages'
import { useSendMessage } from '@/features/chat/hooks/useSendMessage'
import { useMarkMessagesRead } from '@/features/chat/hooks/useMarkMessagesRead'
import { useConversations } from '@/features/chat/hooks/useConversations'
import MessageBubble from '@/features/chat/components/MessageBubble'
import ChatInput from '@/features/chat/components/ChatInput'
import ReportMessageDialog from '@/features/chat/components/ReportMessageDialog'

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: messages, isPending } = useMessages(id)
  const { data: conversations } = useConversations()
  const sendMessage = useSendMessage()
  const markRead = useMarkMessagesRead(id)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null)

  const conversation = conversations?.find(c => c.id === id)

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages && messages.length > 0) {
      const hasUnread = messages.some(m => m.sender_id !== user?.id && !m.read_at)
      if (hasUnread) markRead.mutate()
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const handleSend = (body: string) => {
    if (!id) return
    sendMessage.mutate(
      { conversationId: id, body },
      { onError: () => toast.error('No se pudo enviar el mensaje.') },
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] max-w-175 flex-col md:h-[calc(100dvh-5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-meyah-border-soft bg-white px-4 py-3">
        <Link
          to="/mensajes"
          className="grid h-9 w-9 flex-none place-items-center rounded-full text-meyah-tinta-600 transition-colors hover:bg-meyah-crema-100"
        >
          <ArrowLeft size={20} />
        </Link>
        {conversation ? (
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-meyah-tinta-900">
              {conversation.other_name}
            </h3>
            <p className="truncate text-[12px] text-meyah-jade-700">
              {conversation.job_titulo} · {conversation.company_nombre}
            </p>
          </div>
        ) : (
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-meyah-crema-100" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isPending && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages && messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-[14px] text-meyah-tinta-400">
              Inicia la conversación enviando un mensaje.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {messages?.map(msg => (
            <div key={msg.id} className="group relative">
              <MessageBubble
                body={msg.body}
                createdAt={msg.created_at}
                isMine={msg.sender_id === user?.id}
                readAt={msg.read_at}
              />
              {msg.sender_id !== user?.id && (
                <button
                  type="button"
                  onClick={() => setReportingMessageId(msg.id)}
                  className="absolute top-1 right-1 hidden rounded-full p-1 text-meyah-tinta-400 transition-colors hover:bg-meyah-crema-100 hover:text-meyah-terracota-500 group-hover:block"
                  aria-label="Reportar mensaje"
                >
                  <Flag size={12} />
                </button>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />

      {/* Report dialog */}
      {reportingMessageId && (
        <ReportMessageDialog
          messageId={reportingMessageId}
          onClose={() => setReportingMessageId(null)}
        />
      )}
    </div>
  )
}
