import { ShieldCheck } from 'lucide-react'

interface VerifiedBadgeProps {
  verified: boolean
}

/** Small inline badge that signals a company has been verified. */
export default function VerifiedBadge({ verified }: VerifiedBadgeProps) {
  if (!verified) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-meyah-jade-50 px-2 py-0.5 text-[12.5px] font-semibold leading-none text-meyah-jade-700">
      <ShieldCheck size={13} />
      Verificada
    </span>
  )
}
