import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface FadeInOnScrollProps {
  children: ReactNode
  delay?: number
}

export default function FadeInOnScroll({ children, delay = 0 }: FadeInOnScrollProps) {
  const prefersReducedMotion = useReducedMotion()

  // Respeta prefers-reduced-motion: si el usuario lo activó, renderizamos sin animación
  if (prefersReducedMotion) {
    return <div>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}
