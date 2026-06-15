import type { AnalyticsRange } from '@/features/analytics/hooks/useAnalyticsSummary'

const OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

interface RangeSelectorProps {
  value: AnalyticsRange
  onChange: (range: AnalyticsRange) => void
}

export default function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Seleccionar rango de fechas"
      className="flex rounded-full border border-meyah-border-soft bg-meyah-crema-100 p-0.75"
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`flex-1 rounded-full px-2 py-1.5 text-[12.5px] font-semibold transition-all sm:px-3.5 sm:text-[13px] ${
            value === opt.value
              ? 'bg-white text-meyah-jade-900 shadow-xs'
              : 'text-meyah-tinta-600 hover:text-meyah-jade-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
