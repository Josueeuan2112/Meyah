import { useId } from 'react'

interface SparklineProps {
  points: number[]
  color: string
  width?: number
  height?: number
}

export default function Sparkline({ points, color, width = 64, height = 26 }: SparklineProps) {
  const gid = useId()

  if (points.length < 2) return null

  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const span = max - min || 1
  const stepX = width / (points.length - 1)
  const pad = 3

  const ys = points.map(p => height - pad - ((p - min) / span) * (height - pad * 2))

  const line = points
    .map((_, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${ys[i].toFixed(1)}`)
    .join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      className="flex-none"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={ys[ys.length - 1]} r={2.5} fill={color} />
    </svg>
  )
}
