import { useState, useRef } from 'react'
import { Send } from 'lucide-react'

import { Button } from '@/shared/ui/button'

interface ChatInputProps {
  onSend: (body: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2.5 border-t border-meyah-border-soft bg-white p-3.5">
      <textarea
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje…"
        rows={1}
        maxLength={2000}
        disabled={disabled}
        className="min-h-10 max-h-32 min-w-0 flex-1 resize-none rounded-xl border border-meyah-border bg-meyah-crema-50 px-3.5 py-2.5 text-[14px] text-meyah-tinta-900 outline-none placeholder:text-meyah-tinta-400 focus:border-meyah-jade-500 focus:ring-[3px] focus:ring-meyah-jade-500/15"
      />
      <Button
        type="button"
        size="icon"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="h-10 w-10 flex-none rounded-full"
      >
        <Send size={18} />
      </Button>
    </div>
  )
}
