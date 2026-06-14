import { cn } from '@/shared/lib/utils'

interface MessageBubbleProps {
  body: string
  createdAt: string
  isMine: boolean
  readAt: string | null
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ body, createdAt, isMine, readAt }: MessageBubbleProps) {
  return (
    <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed',
          isMine
            ? 'rounded-br-md bg-meyah-jade-500 text-white'
            : 'rounded-bl-md bg-white text-meyah-tinta-900 border border-meyah-border-soft',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{body}</p>
        <div className={cn(
          'mt-1 flex items-center gap-1.5 text-[11px]',
          isMine ? 'justify-end text-meyah-jade-100' : 'text-meyah-tinta-400',
        )}>
          <span>{formatTime(createdAt)}</span>
          {isMine && readAt && <span>✓✓</span>}
        </div>
      </div>
    </div>
  )
}
