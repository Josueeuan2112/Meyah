import type { StatItem } from './buildStats'

interface StatsStripProps {
  stats: StatItem[]
}

export default function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex flex-col gap-2.5 rounded-card border border-meyah-border-soft bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="grid h-9 w-9 place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700">
            <s.icon size={18} />
          </div>
          <div>
            <span className="font-display text-[24px] font-semibold text-meyah-tinta-900">{s.value}</span>
            <p className="text-[12.5px] text-meyah-tinta-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
