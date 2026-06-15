import { useNavigate } from 'react-router'
import { Check, ChevronRight, CircleCheck, Circle, Lock, LogOut, Pencil, Settings, Shield, ShieldCheck, Sliders, Sparkles } from 'lucide-react'

import type { Profile, Company } from '@/shared/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/ui/button'

// ── Completion Card ──

interface CompletionItem { label: string; ok: boolean }

function computeCandidatoCompletion(p: Profile): CompletionItem[] {
  return [
    { label: 'Datos básicos', ok: !!p.nombre },
    { label: 'Teléfono', ok: !!p.phone },
    { label: 'Ubicación de referencia', ok: p.lat_referencia != null },
    { label: 'CV cargado', ok: !!p.cv_path },
    { label: 'Biografía', ok: !!p.bio },
  ]
}

function computeEmpleadorCompletion(p: Profile, company: Company | null): CompletionItem[] {
  return [
    { label: 'Datos básicos', ok: !!p.nombre },
    { label: 'Teléfono', ok: !!p.phone },
    { label: 'Empresa registrada', ok: !!company },
    { label: 'Descripción de empresa', ok: !!company?.descripcion },
    { label: 'Biografía', ok: !!p.bio },
  ]
}

function ProgressRing({ value, size = 108, stroke = 10, children }: { value: number; size?: number; stroke?: number; children: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2EDE3" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1B998B" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.7,.3,1)' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

interface CompletionCardProps {
  profile: Profile
  company?: Company | null
  onComplete: () => void
}

export function CompletionCard({ profile, company, onComplete }: CompletionCardProps) {
  const items = profile.tipo === 'candidato'
    ? computeCandidatoCompletion(profile)
    : computeEmpleadorCompletion(profile, company ?? null)

  const doneCount = items.filter(i => i.ok).length
  const completion = Math.round((doneCount / items.length) * 100)
  const faltan = items.filter(i => !i.ok)

  return (
    <section className="rounded-panel border border-meyah-border-soft bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-4">
        <ProgressRing value={completion}>
          <span className="font-display text-[26px] font-semibold text-meyah-jade-900">{completion}%</span>
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-meyah-tinta-400">completo</span>
        </ProgressRing>
        <div className="min-w-0">
          <span className="eyebrow">Tu perfil</span>
          <h3 className="text-[18px] leading-tight">
            {completion >= 100 ? '¡Perfil completo!' : 'Casi lo tienes'}
          </h3>
          <p className="mt-1 text-[13px] text-meyah-tinta-600">
            {completion >= 100
              ? 'Tu perfil destaca ante empleadores.'
              : `Te falta${faltan.length === 1 ? '' : 'n'} ${faltan.length} ${faltan.length === 1 ? 'paso' : 'pasos'} para destacar.`}
          </p>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-0.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2.5 rounded-field px-2 py-1.5">
            {it.ok ? (
              <CircleCheck size={17} className="text-meyah-jade-500" fill="#1B998B" stroke="#fff" />
            ) : (
              <Circle size={17} className="text-meyah-border" />
            )}
            <span className={`text-[13.5px] ${it.ok ? 'text-meyah-tinta-400 line-through decoration-meyah-border' : 'font-medium text-meyah-tinta-900'}`}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>

      {completion < 100 && (
        <Button type="button" className="mt-4 w-full" size="sm" onClick={onComplete}>
          <Sparkles size={15} /> Completar perfil
        </Button>
      )}
    </section>
  )
}

// ── Trust Card ──

interface TrustFactor { label: string; ok: boolean }

function computeCandidatoTrust(p: Profile, emailVerified: boolean): TrustFactor[] {
  return [
    { label: emailVerified ? 'Correo verificado' : 'Correo sin confirmar', ok: emailVerified },
    { label: 'Teléfono registrado', ok: !!p.phone },
    { label: 'Ubicación de referencia', ok: p.lat_referencia != null },
    { label: 'CV cargado', ok: !!p.cv_path },
  ]
}

function computeEmpleadorTrust(p: Profile, company: Company | null, emailVerified: boolean): TrustFactor[] {
  return [
    { label: emailVerified ? 'Correo verificado' : 'Correo sin confirmar', ok: emailVerified },
    { label: 'Teléfono registrado', ok: !!p.phone },
    { label: 'Empresa registrada', ok: !!company },
    { label: 'Empresa verificada', ok: !!company?.is_verified },
  ]
}

interface TrustCardProps {
  profile: Profile
  company?: Company | null
}

export function TrustCard({ profile, company }: TrustCardProps) {
  // Verificación real de correo: refleja email_confirmed_at de Supabase Auth,
  // no un valor hardcodeado. Un correo sin confirmar baja el Trust Score real.
  const { user } = useAuth()
  const emailVerified = !!user?.email_confirmed_at

  const factors = profile.tipo === 'candidato'
    ? computeCandidatoTrust(profile, emailVerified)
    : computeEmpleadorTrust(profile, company ?? null, emailVerified)

  const score = Math.round((factors.filter(f => f.ok).length / factors.length) * 100)
  const nivel = score >= 85 ? 'Muy alto' : score >= 60 ? 'Alto' : score >= 40 ? 'Medio' : 'Bajo'

  return (
    <section className="rounded-panel border border-meyah-border-soft bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="eyebrow">Confianza</span>
            <h3 className="text-[19px] leading-tight">Nivel del perfil</h3>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className="font-display text-[34px] font-semibold leading-none text-meyah-jade-900">{score}</span>
          <span className="text-[15px] text-meyah-tinta-400">/100</span>
        </div>
        <span className="rounded-full bg-meyah-jade-50 px-3 py-1 text-[12.5px] font-bold text-meyah-jade-700">{nivel}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-meyah-crema-100">
        <div className="h-full rounded-full bg-meyah-jade-500" style={{ width: `${score}%`, transition: 'width 1s cubic-bezier(.2,.7,.3,1)' }} />
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {factors.map((f, i) => (
          <li key={i} className="flex items-center justify-between text-[13.5px]">
            <span className={f.ok ? 'text-meyah-tinta-600' : 'text-meyah-tinta-400'}>{f.label}</span>
            {f.ok
              ? <Check size={16} className="text-meyah-jade-600" />
              : <span className="text-[11.5px] font-semibold text-meyah-terracota-700">Pendiente</span>}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-2 rounded-field bg-meyah-crema-50 p-3 text-[12px] text-meyah-tinta-400">
        <Shield size={14} className="mt-0.5 flex-none text-meyah-jade-600" />
        Un perfil más confiable aparece mejor posicionado en las búsquedas.
      </p>
    </section>
  )
}

// ── Quick Settings ──

interface QuickSettingsProps {
  onEdit: () => void
}

export function QuickSettings({ onEdit }: QuickSettingsProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    void navigate('/')
  }

  const items = [
    { icon: Pencil, label: 'Editar perfil', onClick: onEdit },
    { icon: Lock, label: 'Cambiar contraseña', onClick: () => void navigate('/recuperar') },
    { icon: Settings, label: 'Configuración de cuenta', onClick: onEdit },
  ]

  return (
    <section className="overflow-hidden rounded-panel border border-meyah-border-soft bg-white shadow-sm">
      <div className="p-5 pb-2 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700">
            <Sliders size={18} />
          </div>
          <div>
            <span className="eyebrow">Atajos</span>
            <h3 className="text-[19px] leading-tight">Configuración rápida</h3>
          </div>
        </div>
      </div>
      <ul className="px-2.5 pb-2.5">
        {items.map((it, i) => (
          <li key={i}>
            <button type="button" onClick={it.onClick}
              className="group flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left transition hover:bg-meyah-crema-50">
              <it.icon size={17} className="flex-none text-meyah-tinta-400 transition group-hover:text-meyah-jade-700" />
              <span className="flex-1 text-[14px] font-medium text-meyah-tinta-900">{it.label}</span>
              <ChevronRight size={16} className="text-meyah-border transition group-hover:translate-x-0.5 group-hover:text-meyah-tinta-400" />
            </button>
          </li>
        ))}
        <li className="mx-3 my-1.5 border-t border-meyah-border-soft" />
        <li>
          <button type="button" onClick={handleSignOut}
            className="group flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left transition hover:bg-meyah-terracota-50">
            <LogOut size={17} className="flex-none text-meyah-terracota-500" />
            <span className="flex-1 text-[14px] font-semibold text-meyah-terracota-700">Cerrar sesión</span>
          </button>
        </li>
      </ul>
    </section>
  )
}
