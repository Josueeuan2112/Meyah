import { Link } from 'react-router'
import { MessageSquare } from 'lucide-react'

import type { ConversationSummary } from '@/features/chat/hooks/useConversations'

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

interface ConversationCardProps {
  conversation: ConversationSummary
}

export default function ConversationCard({ conversation: c }: ConversationCardProps) {
  return (
    <Link
      to={`/mensajes/${c.id}`}
      className="flex items-start gap-3.5 rounded-xl border border-meyah-border-soft bg-white px-4.5 py-3.5 shadow-sm transition-colors hover:border-meyah-jade-500/30 hover:bg-meyah-crema-50"
    >
      {/* Avatar */}
      <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-meyah-jade-50 text-sm font-semibold text-meyah-jade-700">
        {c.other_name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="truncate text-[14.5px] font-semibold text-meyah-tinta-900">
            {c.other_name}
          </h4>
          {c.last_message_at && (
            <span className="flex-none text-[12px] text-meyah-tinta-400">
              {formatRelativeTime(c.last_message_at)}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-meyah-jade-700">
          {c.job_titulo} · {c.company_nombre}
        </p>
        <p className="mt-1 truncate text-[13px] text-meyah-tinta-600">
          {c.last_message ?? (
            <span className="flex items-center gap-1 italic text-meyah-tinta-400">
              <MessageSquare size={12} /> Sin mensajes aún
            </span>
          )}
        </p>
      </div>

      {/* Unread badge */}
      {c.unread_count > 0 && (
        <div className="mt-1 grid h-5.5 min-w-5.5 place-items-center rounded-full bg-meyah-terracota-500 px-1.5 text-[11px] font-bold text-white">
          {c.unread_count > 99 ? '99+' : c.unread_count}
        </div>
      )}
    </Link>
  )
}
