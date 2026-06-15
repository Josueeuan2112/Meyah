import { useState } from 'react'
import { Loader2, User, Building2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMyCompany } from '@/features/companies/hooks/useMyCompany'
import { useMyApplications } from '@/features/applications/hooks/useMyApplications'
import { useEmployerAnalytics } from '@/features/jobs/hooks/useEmployerAnalytics'
import { useCompanyRating } from '@/features/reviews/hooks/useCompanyRating'
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile'
import ProfileHeader from '@/features/profile/components/ProfileHeader'
import StatsStrip from '@/features/profile/components/StatsStrip'
import { buildCandidatoStats, buildEmpleadorStats } from '@/features/profile/components/buildStats'
import PersonalInfo from '@/features/profile/components/PersonalInfo'
import CVUpload from '@/features/profile/components/CVUpload'
import { CompletionCard, TrustCard, QuickSettings } from '@/features/profile/components/ProfileSidebar'
import EditProfileDrawer from '@/features/profile/components/EditProfileDrawer'
import type { ProfileSchemaOutput } from '@/features/profile/schemas/profile.schema'

export default function ProfilePage() {
  const { profile, user, loading } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const updateProfile = useUpdateProfile()

  // Employer-specific data
  const esCand = profile?.tipo === 'candidato'
  const { data: company } = useMyCompany()
  const { data: analytics } = useEmployerAnalytics()
  const { data: companyRating } = useCompanyRating(company?.id)

  // Candidate-specific data
  const { data: applications } = useMyApplications()

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-meyah-tinta-400" />
      </div>
    )
  }

  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">Cargando perfil...</p>
      </div>
    )
  }

  // Build stats
  const stats = esCand
    ? buildCandidatoStats(
        applications?.length ?? 0,
        applications?.filter(a => a.estado !== 'pendiente').length ?? 0,
        !!profile.cv_path,
        profile.created_at,
      )
    : buildEmpleadorStats(
        analytics?.length ?? 0,
        analytics?.reduce((sum, j) => sum + Number(j.applications_total), 0) ?? 0,
        analytics?.reduce((sum, j) => sum + Number(j.views_total), 0) ?? 0,
        companyRating?.averageRating ?? null,
      )

  // Form defaults
  const defaults = {
    nombre: profile.nombre,
    phone: profile.phone ?? '',
    profesion: profile.profesion ?? '',
    bio: profile.bio ?? '',
    lat_referencia: profile.lat_referencia,
    lng_referencia: profile.lng_referencia,
    radio_busqueda_km: profile.radio_busqueda_km,
    is_searchable: profile.is_searchable,
    email_opt_out: profile.email_opt_out,
  }

  const onSubmit = (values: ProfileSchemaOutput) => {
    updateProfile.mutate(values, {
      onSuccess: () => {
        toast.success('Perfil actualizado')
        setEditOpen(false)
      },
      onError: (e) => toast.error(e.message),
    })
  }

  return (
    <div className="mx-auto max-w-300 px-4 pt-7 pb-22.5 sm:px-6 sm:pt-10">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>
        {/* Page heading */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="eyebrow">Tu cuenta</span>
            <h2 className="mt-1.5 text-[clamp(26px,4vw,34px)]">Mi perfil</h2>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-meyah-border-soft bg-white px-3 py-1.5 text-[12.5px] font-semibold text-meyah-tinta-600 shadow-xs sm:inline-flex">
            {esCand ? <User size={14} className="text-meyah-jade-600" /> : <Building2 size={14} className="text-meyah-jade-600" />}
            {esCand ? 'Cuenta de candidato' : 'Cuenta de empleador'}
          </span>
        </div>

        {/* 2-column layout */}
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div className="flex min-w-0 flex-col gap-5">
            <ProfileHeader profile={profile} company={company} onEdit={() => setEditOpen(true)} />
            <StatsStrip stats={stats} />
            <PersonalInfo
              profile={profile}
              email={user.email ?? null}
              company={company}
              companyRating={companyRating}
              onEdit={() => setEditOpen(true)}
            />
            {esCand && (
              <section className="rounded-panel border border-meyah-border-soft bg-white p-5 shadow-sm sm:p-6">
                <CVUpload cvPath={profile.cv_path} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
            <CompletionCard profile={profile} company={company} onComplete={() => setEditOpen(true)} />
            <TrustCard profile={profile} company={company} />
            <QuickSettings onEdit={() => setEditOpen(true)} />
          </aside>
        </div>
      </div>

      {/* Edit drawer */}
      <EditProfileDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        defaultValues={defaults}
        email={user.email ?? null}
        roleLabel={esCand ? 'Candidato' : 'Empleador'}
        onSubmit={onSubmit}
        isSubmitting={updateProfile.isPending}
      />
    </div>
  )
}
