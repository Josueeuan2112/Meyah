import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

// Campo de texto de las pantallas de auth (login/registro): contenedor blanco
// con borde, icono opcional a la izquierda y acción opcional a la derecha
// (ej. "Ver/Ocultar"). El anillo de foco vive en el contenedor (focus-within)
// porque el input interno no tiene borde propio.

interface AuthInputProps extends ComponentProps<'input'> {
  icon?: ReactNode
  trailing?: ReactNode
}

export default function AuthInput({ icon, trailing, className, ...props }: AuthInputProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-field border border-meyah-border bg-white px-3.5',
        'transition-[border-color,box-shadow] duration-200',
        'focus-within:border-meyah-jade-500 focus-within:shadow-[0_0_0_3px_rgba(27,153,139,0.14)]',
        'has-[[aria-invalid=true]]:border-meyah-terracota-500',
        className,
      )}
    >
      {icon && <span className="flex-none text-meyah-tinta-400">{icon}</span>}
      <input
        className="w-full min-w-0 flex-1 bg-transparent py-[13px] text-[15px] text-meyah-tinta-900 outline-none placeholder:text-meyah-tinta-400"
        {...props}
      />
      {trailing}
    </div>
  )
}
