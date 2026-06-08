import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile'
import ProfileForm from '@/features/profile/components/ProfileForm'
import type { ProfileSchemaOutput } from '@/features/profile/schemas/profile.schema'

export default function ProfilePage() {
  const { profile, loading } = useAuth()
  const updateProfile = useUpdateProfile()

  // Estado: cargando sesión
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Estado: sin profile (raro, pero posible los primeros instantes)
  if (!profile) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">Cargando perfil...</p>
      </div>
    )
  }

  const defaults = {
    nombre: profile.nombre,
    phone: profile.phone ?? '',
    lat_referencia: profile.lat_referencia,
    lng_referencia: profile.lng_referencia,
    is_searchable: profile.is_searchable,
  }

  const onSubmit = (values: ProfileSchemaOutput) => {
    updateProfile.mutate(values, {
      onSuccess: () => toast.success('Perfil actualizado'),
      onError: (e) => toast.error(e.message),
    })
  }

  return (
    <div className="px-4 py-10 md:py-16">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-meyah-terracota-700">
            TU CUENTA
          </span>
          <h1 className="font-display text-3xl md:text-4xl text-meyah-jade-900 mt-3">
            Mi perfil
          </h1>
        </div>

        <ProfileForm
          defaultValues={defaults}
          onSubmit={onSubmit}
          isSubmitting={updateProfile.isPending}
        />

      </div>
    </div>
  )
}
