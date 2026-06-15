import { useMutation } from '@tanstack/react-query'

import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ProfileSchemaOutput } from '@/features/profile/schemas/profile.schema'

export function useUpdateProfile() {
  const { user, reloadProfile } = useAuth()

  return useMutation({
    mutationFn: async (values: ProfileSchemaOutput) => {
      if (!user) throw new Error('Sesión no válida')

      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: values.nombre,
          phone: values.phone,
          profesion: values.profesion || null,
          bio: values.bio || null,
          lat_referencia: values.lat_referencia,
          lng_referencia: values.lng_referencia,
          radio_busqueda_km: values.radio_busqueda_km,
          is_searchable: values.is_searchable,
          email_opt_out: values.email_opt_out,
        })
        .eq('id', user.id)

      if (error) throw error
    },
    onSuccess: async () => {
      await reloadProfile()
    },
  })
}
