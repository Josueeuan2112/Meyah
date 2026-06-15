import { Briefcase, Building2, Calendar, Mail, MapPin, Pencil, Phone, Star, User } from 'lucide-react'

import type { Profile, Company } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { JOB_CATEGORIES } from '@/features/jobs/schemas/categories'

interface PersonalInfoProps {
  profile: Profile
  email: string | null
  company?: Company | null
  companyRating?: { averageRating: number; reviewCount: number } | null
  onEdit: () => void
}

export default function PersonalInfo({ profile, email, company, companyRating, onEdit }: PersonalInfoProps) {
  const esCand = profile.tipo === 'candidato'

  const rows = [
    { icon: User, label: 'Nombre completo', value: profile.nombre },
    { icon: Mail, label: 'Correo electrónico', value: email ?? '—' },
    { icon: Phone, label: 'Teléfono', value: profile.phone ?? 'Sin registrar' },
    { icon: esCand ? Briefcase : Building2, label: esCand ? 'Profesión u oficio' : 'Empresa', value: esCand ? (profile.profesion ?? 'Sin registrar') : (company?.nombre ?? 'Sin empresa') },
    { icon: MapPin, label: 'Ubicación', value: profile.lat_referencia != null ? 'Mérida, Yucatán' : 'Sin ubicación' },
    { icon: Calendar, label: 'Fecha de registro', value: new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.created_at)) },
  ]

  // Resolve category labels from values
  const categoryLabels = (profile.categorias_interes ?? []).map(
    val => JOB_CATEGORIES.find(c => c.value === val)?.label ?? val
  )

  return (
    <section className="rounded-panel border border-meyah-border-soft bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700">
            <User size={18} />
          </div>
          <div>
            <span className="eyebrow">Datos de tu cuenta</span>
            <h3 className="text-[19px] leading-tight">Información personal</h3>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil size={14} /> Editar
        </Button>
      </div>

      {/* Data grid */}
      <div className="mt-5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-3 rounded-field px-2.5 py-3 transition hover:bg-meyah-crema-50">
            <r.icon size={17} className="mt-0.5 flex-none text-meyah-tinta-400" />
            <div className="min-w-0">
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-meyah-tinta-400">{r.label}</span>
              <p className="mt-0.5 truncate text-[14.5px] font-medium text-meyah-tinta-900">{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bio */}
      <div className="mt-3 rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-4">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-meyah-tinta-400">Biografía</span>
        <p className="mt-1.5 text-[14px] leading-[1.6] text-meyah-tinta-600">
          {profile.bio || 'Aún no has agregado una biografía. Cuéntales a los demás un poco sobre ti.'}
        </p>
      </div>

      {/* Categories (candidato) or Rating (empleador) */}
      {esCand ? (
        categoryLabels.length > 0 && (
          <div className="mt-4">
            <span className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-meyah-tinta-400">Categorías de interés</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryLabels.map((c, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-meyah-crema-100 px-3 py-1.5 text-[13px] font-semibold text-meyah-tinta-600">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )
      ) : companyRating ? (
        <div className="mt-4 flex items-center gap-3 rounded-card border border-meyah-border-soft bg-meyah-crema-50 p-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} size={16}
                className={n <= Math.round(companyRating.averageRating) ? 'text-meyah-terracota-500' : 'text-meyah-border'}
                fill={n <= Math.round(companyRating.averageRating) ? '#C84B31' : 'none'} />
            ))}
          </div>
          <span className="text-[14px] font-semibold text-meyah-tinta-900">{companyRating.averageRating}</span>
          <span className="text-[13px] text-meyah-tinta-400">· {companyRating.reviewCount} reseñas de tu empresa</span>
        </div>
      ) : null}
    </section>
  )
}
