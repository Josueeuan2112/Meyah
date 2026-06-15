import { useEffect } from 'react'
import { X, DollarSign, Clock } from 'lucide-react'

import { JOB_SCHEDULES } from '@/features/jobs/schemas/categories'
import type { JobScheduleValue } from '@/features/jobs/schemas/categories'
import { Button } from '@/shared/ui/button'

interface FilterDrawerProps {
  schedules: Set<JobScheduleValue>
  toggleSchedule: (v: JobScheduleValue) => void
  salaryMin: number | null
  setSalaryMin: (v: number | null) => void
  salaryMax: number | null
  setSalaryMax: (v: number | null) => void
  resultCount: number
  onClose: () => void
}

export default function FilterDrawer({
  schedules,
  toggleSchedule,
  salaryMin,
  setSalaryMin,
  salaryMax,
  setSalaryMax,
  resultCount,
  onClose,
}: FilterDrawerProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end bg-meyah-tinta-900/40 backdrop-blur-[3px] animate-[fadeIn_.2s_forwards]"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-h-[85dvh] overflow-y-auto rounded-t-panel bg-meyah-crema-50 px-5 pb-6 pt-5 shadow-lg animate-[drawerUp_.32s_cubic-bezier(.2,.7,.3,1)_forwards]"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[20px]">Filtros</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="grid h-9 w-9 place-items-center rounded-full bg-meyah-crema-100 text-meyah-tinta-600 hover:bg-meyah-border"
          >
            <X size={18} />
          </button>
        </div>

        {/* Jornada */}
        <FilterSection icon={<Clock size={16} />} label="Tipo de jornada">
          <div className="flex flex-wrap gap-2">
            {JOB_SCHEDULES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleSchedule(s.value)}
                data-active={schedules.has(s.value)}
                className="chip"
              >
                {s.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Salary range */}
        <FilterSection icon={<DollarSign size={16} />} label="Rango salarial (MXN/mes)">
          <div className="flex items-center gap-3">
            <SalaryInput
              value={salaryMin}
              onChange={setSalaryMin}
              placeholder="ej. 8,000"
              label="Desde"
            />
            <span className="text-[13px] text-meyah-tinta-400">–</span>
            <SalaryInput
              value={salaryMax}
              onChange={setSalaryMax}
              placeholder="ej. 25,000"
              label="Hasta"
            />
          </div>
        </FilterSection>

        {/* CTA */}
        <Button className="mt-6 w-full" onClick={onClose}>
          Ver {resultCount} vacante{resultCount !== 1 && 's'}
        </Button>
      </div>
    </div>
  )
}

function FilterSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-meyah-tinta-600">
        {icon} {label}
      </div>
      {children}
    </div>
  )
}

function SalaryInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: number | null
  onChange: (v: number | null) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="flex-1">
      <label className="mb-1 block text-[12px] text-meyah-tinta-400">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value !== null ? value.toLocaleString('es-MX') : ''}
        onChange={e => {
          const raw = e.target.value.replace(/\D/g, '')
          onChange(raw === '' ? null : Number(raw))
        }}
        placeholder={placeholder}
        className="w-full rounded-field border border-meyah-border bg-white px-3.5 py-2.5 text-[14px] text-meyah-tinta-900 outline-none placeholder:text-meyah-tinta-400 focus:border-meyah-jade-500 focus:ring-[3px] focus:ring-meyah-jade-500/15"
      />
    </div>
  )
}
