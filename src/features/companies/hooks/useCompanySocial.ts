import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Company } from '@/shared/types'

// Seguidores: contador público (RPC) 
export function useFollowersCount(companyId: string | undefined) {
  return useQuery<number>({
    queryKey: ['company', 'followers', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('company_followers_count', {
        p_company_id: companyId!,
      })
      if (error) throw error
      return data ?? 0
    },
  })
}

// Seguir empresa (solo candidato)
export function useFollowState(companyId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const stateQuery = useQuery<boolean>({
    queryKey: ['company', 'follow-state', companyId, user?.id],
    enabled: !!companyId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_follows')
        .select('company_id')
        .eq('company_id', companyId!)
        .eq('candidato_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return !!data
    },
  })

  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      if (!user) throw new Error('Sesión no válida')
      if (next) {
        const { error } = await supabase
          .from('company_follows')
          .insert({ company_id: companyId!, candidato_id: user.id })
        // 23505 = ya seguía: tratar como éxito idempotente
        if (error && error.code !== '23505') throw error
      } else {
        const { error } = await supabase
          .from('company_follows')
          .delete()
          .eq('company_id', companyId!)
          .eq('candidato_id', user.id)
        if (error) throw error
      }
      return next
    },
    onSuccess: next => {
      queryClient.setQueryData(['company', 'follow-state', companyId, user?.id], next)
      // El contador público se recalcula desde el servidor.
      void queryClient.invalidateQueries({ queryKey: ['company', 'followers', companyId] })
    },
  })

  return {
    isFollowing: stateQuery.data ?? false,
    isLoading: stateQuery.isLoading,
    toggle: (next: boolean) => toggle.mutate(next),
    isPending: toggle.isPending,
  }
}

// Guardar en favoritos (privado, solo candidato)─
export function useSaveState(companyId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const stateQuery = useQuery<boolean>({
    queryKey: ['company', 'save-state', companyId, user?.id],
    enabled: !!companyId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_saves')
        .select('company_id')
        .eq('company_id', companyId!)
        .eq('candidato_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return !!data
    },
  })

  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      if (!user) throw new Error('Sesión no válida')
      if (next) {
        const { error } = await supabase
          .from('company_saves')
          .insert({ company_id: companyId!, candidato_id: user.id })
        if (error && error.code !== '23505') throw error
      } else {
        const { error } = await supabase
          .from('company_saves')
          .delete()
          .eq('company_id', companyId!)
          .eq('candidato_id', user.id)
        if (error) throw error
      }
      return next
    },
    onSuccess: next => {
      queryClient.setQueryData(['company', 'save-state', companyId, user?.id], next)
    },
  })

  return {
    isSaved: stateQuery.data ?? false,
    toggle: (next: boolean) => toggle.mutate(next),
    isPending: toggle.isPending,
  }
}

// Reportar empresa
export function useReportCompany(companyId: string | undefined) {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (reason: string) => {
      if (!user) throw new Error('Sesión no válida')
      const { error } = await supabase
        .from('company_reports')
        // reporter_id tiene DEFAULT auth.uid(); lo pasamos explícito por claridad.
        .insert({ company_id: companyId!, reporter_id: user.id, reason: reason.trim() })
      if (error) throw error
    },
  })
}

// Enviar mensaje: conversación candidato → empresa─
// Crea (o recupera) la conversación de empresa. La policy INSERT exige que
// empleador_id sea el owner_id REAL de la empresa, por eso necesitamos la fila.
export function useStartCompanyConversation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (company: Pick<Company, 'id' | 'owner_id'>): Promise<string> => {
      if (!user) throw new Error('Sesión no válida')

      const { data: existing, error: findErr } = await supabase
        .from('conversations')
        .select('id')
        .eq('company_id', company.id)
        .eq('candidato_id', user.id)
        .maybeSingle()
      if (findErr) throw findErr
      if (existing) return existing.id

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          company_id: company.id,
          candidato_id: user.id,
          empleador_id: company.owner_id,
          job_id: null,
        })
        .select('id')
        .single()
      // 23505 = otra pestaña/doble clic creó la conversación en paralelo. No es
      // un fallo: recuperamos la existente con el mismo criterio del find inicial
      // (mismo patrón idempotente que useFollowState/useSaveState).
      if (error) {
        if (error.code === '23505') {
          const { data: raced, error: raceErr } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', company.id)
            .eq('candidato_id', user.id)
            .single()
          if (raceErr) throw raceErr
          return raced.id
        }
        throw error
      }
      return data.id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations', 'list'] })
    },
  })
}
