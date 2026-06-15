import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { JobCategoryValue, JobScheduleValue } from '@/features/jobs/schemas/categories'
import type { NearbyJob } from '@/features/jobs/hooks/useNearbyJobs'

export function useJobFilters() {
  const { profile } = useAuth()

  // Pre-activate categories from candidate's categorias_interes
  const initialCategories = useMemo<Set<JobCategoryValue>>(() => {
    const prefs = profile?.categorias_interes as JobCategoryValue[] | null | undefined
    return prefs?.length ? new Set(prefs) : new Set()
  }, [profile?.categorias_interes])

  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<Set<JobCategoryValue>>(new Set())
  const [schedules, setSchedules] = useState<Set<JobScheduleValue>>(new Set())
  const [salaryMin, setSalaryMin] = useState<number | null>(null)
  const [salaryMax, setSalaryMax] = useState<number | null>(null)

  // Sync categories when profile loads asynchronously (useState ignores
  // changes to the initial value after the first render).
  const userTouchedCategories = useRef(false)

  useEffect(() => {
    if (!userTouchedCategories.current) setCategories(initialCategories)
  }, [initialCategories])

  const toggleCategory = useCallback((value: JobCategoryValue) => {
    userTouchedCategories.current = true
    setCategories(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  const toggleSchedule = useCallback((value: JobScheduleValue) => {
    setSchedules(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }, [])

  const clearAllCategories = useCallback(() => {
    userTouchedCategories.current = true
    setCategories(new Set())
  }, [])

  const hasFilters =
    search.trim() !== '' ||
    categories.size > 0 ||
    schedules.size > 0 ||
    salaryMin !== null ||
    salaryMax !== null

  const activeFilterCount =
    (categories.size > 0 ? 1 : 0) +
    (schedules.size > 0 ? 1 : 0) +
    (salaryMin !== null || salaryMax !== null ? 1 : 0)

  const clearFilters = useCallback(() => {
    setSearch('')
    userTouchedCategories.current = false
    setCategories(initialCategories)
    setSchedules(new Set())
    setSalaryMin(null)
    setSalaryMax(null)
  }, [initialCategories])

  const filterJobs = useCallback(
    (jobs: NearbyJob[]) => {
      const query = search.trim().toLowerCase()

      return jobs.filter(job => {
        // Text search
        if (
          query !== '' &&
          !job.titulo.toLowerCase().includes(query) &&
          !job.company_nombre.toLowerCase().includes(query)
        ) return false

        // Category multi-select (empty = all)
        if (categories.size > 0 && !categories.has(job.categoria as JobCategoryValue)) return false

        // Schedule multi-select (empty = all)
        if (schedules.size > 0 && !schedules.has(job.jornada as JobScheduleValue)) return false

        // Salary range intersection
        if (salaryMin !== null && job.salario_max < salaryMin) return false
        if (salaryMax !== null && job.salario_min > salaryMax) return false

        return true
      })
    },
    [search, categories, schedules, salaryMin, salaryMax],
  )

  return {
    search,
    setSearch,
    categories,
    toggleCategory,
    clearAllCategories,
    schedules,
    toggleSchedule,
    salaryMin,
    setSalaryMin,
    salaryMax,
    setSalaryMax,
    filterJobs,
    hasFilters,
    activeFilterCount,
    clearFilters,
    hasPresetCategories: initialCategories.size > 0,
  }
}
