import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile'
import ProfileForm from '@/features/profile/components/ProfileForm'
import CVUpload from '@/features/profile/components/CVUpload'
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
    radio_busqueda_km: profile.radio_busqueda_km,
    is_searchable: profile.is_searchable,
    email_opt_out: profile.email_opt_out,
  }

  const onSubmit = (values: ProfileSchemaOutput) => {
    updateProfile.mutate(values, {
      onSuccess: () => toast.success('Perfil actualizado'),
      onError: (e) => toast.error(e.message),
    })
  }

  return (
    <div className="mx-auto max-w-295 px-4 pt-12 pb-22.5 sm:px-6">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>
        <span className="eyebrow">Tu cuenta</span>
        <h1 className="mt-2.5 text-[clamp(30px,4vw,40px)]">Mi perfil</h1>
        <p className="mt-3 text-[15.5px] text-meyah-tinta-600">
          Tu ubicación de referencia define qué vacantes ves primero.
        </p>

        <ProfileForm
          defaultValues={defaults}
          onSubmit={onSubmit}
          isSubmitting={updateProfile.isPending}
          roleLabel={profile.tipo === 'empleador' ? 'Empleador' : 'Candidato'}
        />

        {profile.tipo === 'candidato' && (
          <div className="mt-6">
            <CVUpload cvPath={profile.cv_path} />
          </div>
        )}
      </div>
    </div>
  )
}
