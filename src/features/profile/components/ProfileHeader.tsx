import { BadgeCheck, Briefcase, Building2, Camera, MapPin, Pencil, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import type { Profile, Company } from '@/shared/types'
import { Button } from '@/shared/ui/button'

interface ProfileHeaderProps {
  profile: Profile
  company?: Company | null
  onEdit: () => void
}

function getIniciales(nombre: string): string {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'
}

function formatMemberSince(dateStr: string): string {
  const created = new Date(dateStr)
  const now = new Date()
  const months = Math.floor((now.getTime() - created.getTime()) / (30.44 * 24 * 60 * 60 * 1000))
  if (months < 1) return 'hace menos de un mes'
  if (months === 1) return 'hace 1 mes'
  if (months < 12) return `hace ${months} meses`
  const years = Math.floor(months / 12)
  return years === 1 ? 'hace 1 año' : `hace ${years} años`
}

export default function ProfileHeader({ profile, company, onEdit }: ProfileHeaderProps) {
  const esCand = profile.tipo === 'candidato'
  const iniciales = getIniciales(profile.nombre)

  const fechaRegistro = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.created_at))

  const shareProfile = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: profile.nombre, url }) } catch { /* cancelled */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace de perfil copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  // Location text from profile or company
  const ubicacion = esCand
    ? (profile.lat_referencia != null ? 'Mérida, Yucatán' : null)
    : (company?.nombre ? 'Mérida, Yucatán' : null)

  return (
    <section className="overflow-hidden rounded-panel border border-meyah-border-soft bg-white shadow-sm">
      {/* Cover with greca pattern */}
      <div className="greca relative h-28 bg-meyah-jade-50 sm:h-32">
        <div className="absolute right-4 top-4">
          {esCand && profile.disponibilidad ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-meyah-border-soft bg-white/95 px-3 py-1.5 text-[12.5px] font-semibold text-meyah-jade-700 shadow-xs backdrop-blur">
              <span className="relative grid place-items-center">
                <span className="h-2 w-2 rounded-full bg-[#1B998B]" />
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-[#1B998B]" />
              </span>
              Disponible para trabajar
            </span>
          ) : !esCand && company?.is_verified ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-meyah-border-soft bg-white/95 px-3 py-1.5 text-[12.5px] font-semibold text-meyah-jade-700 shadow-xs backdrop-blur">
              <BadgeCheck size={15} className="text-meyah-jade-600" /> Empresa verificada
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-12 flex items-end justify-between gap-4 sm:-mt-14">
          {/* Avatar */}
          <div className="relative flex-none" style={{ width: 104, height: 104 }}>
            <div className="grid h-full w-full place-items-center rounded-full bg-meyah-jade-500 font-display text-[36px] font-semibold text-white ring-4 ring-white shadow-md select-none">
              {iniciales}
            </div>
            <button
              type="button"
              aria-label="Cambiar foto"
              className="absolute -bottom-0.5 -right-0.5 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-meyah-tinta-900 text-white shadow-md transition hover:bg-meyah-jade-700"
              onClick={() => toast.info('Próximamente: subir foto de perfil')}
            >
              <Camera size={14} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pb-1">
            <Button type="button" variant="outline" size="sm" onClick={shareProfile}>
              <Share2 size={15} /> <span className="hidden sm:inline">Compartir</span>
            </Button>
            <Button type="button" size="sm" onClick={onEdit}>
              <Pencil size={15} /> Editar perfil
            </Button>
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] sm:text-[30px]">{profile.nombre}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-meyah-jade-50 px-2.5 py-1 text-[12px] font-bold text-meyah-jade-700">
              <BadgeCheck size={14} /> Verificado
            </span>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] text-meyah-tinta-600">
            {(profile.profesion || (esCand ? null : company?.nombre)) && (
              <>
                <span className="inline-flex items-center gap-1.5 font-medium text-meyah-tinta-900">
                  {esCand ? <Briefcase size={15} className="text-meyah-jade-600" /> : <Building2 size={15} className="text-meyah-jade-600" />}
                  {esCand ? profile.profesion : company?.nombre}
                </span>
                <span className="text-meyah-border">·</span>
              </>
            )}
            {ubicacion && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-meyah-jade-600" />{ubicacion}
              </span>
            )}
          </p>
          <p className="mt-1.5 text-[13px] text-meyah-tinta-400">
            Miembro {formatMemberSince(profile.created_at)} · Se unió el {fechaRegistro}
          </p>
        </div>
      </div>
    </section>
  )
}
