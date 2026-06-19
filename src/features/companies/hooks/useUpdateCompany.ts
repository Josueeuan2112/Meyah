import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Company, CompanyUpdate } from '@/shared/types'
import type { CompanyFormValues } from '@/features/companies/schemas/companySchema'

// undefined → null: las columnas son nullable; nunca persistimos string vacío.
const nn = <T>(v: T | undefined): T | null => (v === undefined ? null : v)

export function useUpdateCompany() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyFormValues }): Promise<Company> => {
      // is_verified / verified_at NO se tocan aquí: el trigger de la BD impide
      // que un no-admin los modifique. Solo persistimos campos editables.
      const patch: CompanyUpdate = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        direccion: data.direccion,
        sitio_web: nn(data.sitio_web),
        lat: nn(data.lat),
        lng: nn(data.lng),
        razon_social: nn(data.razon_social),
        correo: nn(data.correo),
        telefono: nn(data.telefono),
        categoria: nn(data.categoria),
        tamano: nn(data.tamano),
        historia: nn(data.historia),
        mision: nn(data.mision),
        vision: nn(data.vision),
        valores: data.valores,
        beneficios: data.beneficios,
        radio_km: nn(data.radio_km),
        horarios: data.horarios ?? null,
        instagram: nn(data.instagram),
        facebook: nn(data.facebook),
        linkedin: nn(data.linkedin),
        tiktok: nn(data.tiktok),
        x: nn(data.x),
      }

      const { data: updated, error } = await supabase
        .from('companies')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: updated => {
      void queryClient.invalidateQueries({ queryKey: ['company', 'mine', user?.id] })
      // El perfil público lee por id: refrescarlo para reflejar los cambios.
      void queryClient.invalidateQueries({ queryKey: ['company', 'public', updated.id] })
    },
  })
}
