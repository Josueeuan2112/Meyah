import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import { slugify } from '@/shared/lib/slugify'
import type { Job } from '@/shared/types'
import type { JobFormValues } from '@/features/jobs/schemas/jobSchema'

export function useCreateJob() {
  const queryClient = useQueryClient()
  const { data: company } = useMyCompany()

  return useMutation({
    mutationFn: async (values: JobFormValues): Promise<Job> => {
      if (!company) {
        throw new Error('No tienes una empresa registrada.')
      }

      // El slug se genera aquí y se congela para siempre.
      // useUpdateJob nunca lo regenera para preservar URLs existentes.
      const slug = slugify(values.titulo)

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          titulo:      values.titulo,
          descripcion: values.descripcion,
          categoria:   values.categoria,
          jornada:     values.jornada,
          salario_min: values.salario_min,
          salario_max: values.salario_max,
          lat:         values.lat,
          lng:         values.lng,
          slug:        slug,
          company_id:  company.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', 'mine', company?.id] })
    },
  })
}
