import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  MapPin,
  Route,
  Search,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AuthInput from '@/features/auth/components/AuthInput'
import ZonePicker from '@/features/auth/components/ZonePicker'
import { JOB_CATEGORIES, JOB_SCHEDULES, ICON_BY_CATEGORY } from '@/features/jobs/schemas/categories'
import type { JobCategoryValue } from '@/features/jobs/schemas/categories'
import { geocodeAddress, reverseGeocodeZone } from '@/shared/lib/geocode'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

const MERIDA_CENTER: [number, number] = [20.9674, -89.5926]

// Wizard de registro sobre el layout del onboarding (panel izquierdo + mapa
// a pantalla completa a la derecha):
//   candidato → Tu zona → Tu perfil → ¡Listo!  (los 3 pasos del diseño)
//   empleador → Tu perfil → ¡Listo!            (la zona no aplica: su ubicación
//                                               vive en la empresa, no en el perfil)
// La elección de rol es una pantalla previa al stepper.
type Step = 'rol' | 'zona' | 'perfil' | 'listo'

const riseStyle = { animation: 'rise .4s cubic-bezier(.2,.7,.3,1) forwards' }

const lbl = 'text-[13.5px] font-semibold text-meyah-tinta-900'
const err = 'text-[12.5px] text-meyah-terracota-700'
const opcional = 'font-normal not-italic text-meyah-tinta-400'
const backBtn =
  'mb-4 inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-meyah-tinta-600 transition-colors hover:text-meyah-jade-700'
const copyP = 'max-w-[380px] text-[15.5px] leading-[1.6] text-meyah-tinta-600'
const stepH1 = 'mb-[18px] mt-3 text-[clamp(34px,4.4vw,52px)] leading-[1.0] tracking-[-0.03em]'
const hintPill =
  'pointer-events-none absolute left-1/2 top-[34px] z-[1000] inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-[18px] py-[11px] text-[13.5px] font-semibold text-white shadow-lg'

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      Meyah<span className="h-1.5 w-1.5 self-center rounded-full bg-meyah-terracota-500" />
    </span>
  )
}

function StepPills({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 lg:mb-[38px]">
      {labels.map((label, i) => (
        <span
          key={label}
          className={cn(
            'rounded-full px-3 py-1.5 text-[12px] font-semibold',
            i === current
              ? 'bg-meyah-jade-900 text-white'
              : i < current
                ? 'bg-meyah-jade-50 text-meyah-jade-700'
                : 'bg-meyah-crema-100 text-meyah-tinta-400',
          )}
        >
          {i + 1} · {label}
        </span>
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const { signUp, session, resendConfirmation } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('rol')
  const [show, setShow] = useState(false)
  const [address, setAddress] = useState('')
  const [searching, setSearching] = useState(false)
  const [moved, setMoved] = useState(false)
  const [zona, setZona] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      // El pin arranca en el centro de Mérida y el candidato lo ajusta;
      // radio default de 5 km (cubre la mayoría de colonias colindantes)
      lat_referencia: MERIDA_CENTER[0],
      lng_referencia: MERIDA_CENTER[1],
      radio_busqueda_km: 5,
      categorias_interes: [],
    },
  })

  const tipo = watch('tipo')
  const lat = watch('lat_referencia') ?? MERIDA_CENTER[0]
  const lng = watch('lng_referencia') ?? MERIDA_CENTER[1]
  const radio = watch('radio_busqueda_km') ?? 5
  const categorias = watch('categorias_interes') ?? []
  const disponibilidad = watch('disponibilidad')
  const nombre = watch('nombre')

  const esCandidato = tipo === 'candidato'
  const firstName = nombre?.trim().split(' ')[0] ?? ''
  const zonaLabel = zona ? `${zona}, Mérida` : 'Mérida, Yucatán'

  // Nombre de la colonia bajo el pin (tarjeta "Tu zona aproximada").
  // Debounce de 700 ms: Nominatim acepta máximo 1 request por segundo.
  useEffect(() => {
    const t = setTimeout(() => {
      void reverseGeocodeZone(lat, lng).then(setZona)
    }, 700)
    return () => clearTimeout(t)
  }, [lat, lng])

  const stepperLabels = esCandidato ? ['Tu zona', 'Tu perfil', '¡Listo!'] : ['Tu perfil', '¡Listo!']
  const stepperIndex =
    step === 'listo' ? stepperLabels.length - 1 : step === 'perfil' ? (esCandidato ? 1 : 0) : 0

  const pickRole = (value: 'candidato' | 'empleador') => {
    setValue('tipo', value, { shouldValidate: true })
    setStep(value === 'candidato' ? 'zona' : 'perfil')
  }

  const movePin = (newLat: number, newLng: number) => {
    setValue('lat_referencia', newLat, { shouldValidate: true })
    setValue('lng_referencia', newLng, { shouldValidate: true })
    setMoved(true)
  }

  const handleAddressSearch = async () => {
    const q = address.trim()
    if (!q) return
    setSearching(true)
    try {
      const result = await geocodeAddress(q)
      if (result) {
        movePin(result.lat, result.lng)
      } else {
        toast.error('No encontramos esa dirección en Mérida. Mueve el pin directamente en el mapa.')
      }
    } catch {
      toast.error('No se pudo buscar la dirección. Intenta de nuevo.')
    } finally {
      setSearching(false)
    }
  }

  const toggleCategoria = (value: JobCategoryValue) => {
    setValue(
      'categorias_interes',
      categorias.includes(value) ? categorias.filter(c => c !== value) : [...categorias, value],
      { shouldValidate: true },
    )
  }

  const onSubmit = async (data: RegisterFormData) => {
    const candidato = data.tipo === 'candidato'

    const { error } = await signUp({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      tipo: data.tipo,
      phone: data.phone,
      lat_referencia: candidato ? data.lat_referencia ?? null : null,
      lng_referencia: candidato ? data.lng_referencia ?? null : null,
      radio_busqueda_km: candidato ? data.radio_busqueda_km ?? null : null,
      categorias_interes: candidato && data.categorias_interes?.length ? data.categorias_interes : null,
      disponibilidad: candidato ? data.disponibilidad ?? null : null,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('¡Cuenta creada con éxito!')
    setStep('listo')
  }

  // Reenvío del correo de confirmación desde el paso final (cuando la
  // verificación de email está activa y aún no hay sesión).
  const resendEmail = async () => {
    const { error } = await resendConfirmation(getValues('email'))
    if (error) {
      toast.error('No se pudo reenviar. Espera un momento e intenta de nuevo.')
      return
    }
    toast.success('Correo reenviado')
  }

  // Tarjetas resumen del paso final. Sin sesión no se pueden contar vacantes
  // cercanas (jobs_near solo tiene grant a authenticated), así que el dato
  // destacado son las categorías elegidas.
  const resumen: { icon: LucideIcon; valor: string; detalle: string; hl: boolean }[] = esCandidato
    ? [
        { icon: MapPin, valor: zona ?? 'Mérida', detalle: 'tu zona', hl: false },
        { icon: Route, valor: `${radio} km`, detalle: 'radio de búsqueda', hl: false },
        categorias.length > 0
          ? {
              icon: Zap,
              valor: String(categorias.length),
              detalle: categorias.length === 1 ? 'categoría de interés' : 'categorías de interés',
              hl: true,
            }
          : { icon: Zap, valor: 'Todas', detalle: 'las categorías abiertas', hl: true },
      ]
    : [{ icon: Building2, valor: 'Registra tu empresa', detalle: 'tu siguiente paso', hl: true }]

  const chipBase =
    'inline-flex items-center gap-1.5 rounded-full border px-[13px] py-[9px] text-[13px] font-medium transition-all duration-150'
  const chipOff =
    'border-meyah-border bg-meyah-crema-50 text-meyah-tinta-600 hover:border-meyah-tinta-400 hover:text-meyah-tinta-900'

  return (
    <div className="grid min-h-screen lg:h-screen lg:grid-cols-[minmax(380px,460px)_1fr]">

      {/* ── Panel izquierdo: pasos ── */}
      <aside className="flex flex-col px-[22px] pb-9 pt-7 lg:overflow-y-auto lg:px-[42px] lg:py-[34px]">
        <Link to="/" className="mb-7 self-start">
          <Wordmark className="flex items-baseline gap-0.75 font-display text-[26px] font-semibold text-meyah-jade-900" />
        </Link>

        {step !== 'rol' && <StepPills labels={stepperLabels} current={stepperIndex} />}

        {/* ── Paso previo: elegir rol ── */}
        {step === 'rol' && (
          <div className="flex flex-col lg:flex-1" style={riseStyle}>
            <div>
              <span className="eyebrow">Bienvenido a Meyah</span>
              <h1 className={stepH1}>¿Qué te trae<br />a Meyah?</h1>
              <p className={copyP}>
                Crear tu cuenta es gratis y toma un minuto. Dinos cómo la usarás y te llevamos directo.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => pickRole('candidato')}
                className="group flex items-center gap-3.5 rounded-card border border-meyah-border-soft bg-white px-[18px] py-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-meyah-jade-500 hover:shadow-md"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-meyah-jade-50 text-meyah-jade-700">
                  <Briefcase size={20} />
                </span>
                <span className="flex-1">
                  <b className="block font-display text-[18px] font-semibold leading-tight text-meyah-jade-900">
                    Busco trabajo
                  </b>
                  <span className="mt-0.5 block text-[13px] text-meyah-tinta-600">
                    Quiero ver vacantes cerca de mi casa
                  </span>
                </span>
                <ArrowRight
                  size={17}
                  className="flex-none text-meyah-tinta-400 transition group-hover:translate-x-0.5 group-hover:text-meyah-jade-700"
                />
              </button>

              {/* TEMPORAL: registro de empleador oculto durante las pruebas con
                  candidatos reales (no queremos empresas de prueba). La lógica
                  del wizard de empleador sigue intacta — para reactivarlo solo
                  hay que descomentar este bloque.
              <button
                type="button"
                onClick={() => pickRole('empleador')}
                className="group flex items-center gap-3.5 rounded-card border border-meyah-border-soft bg-white px-[18px] py-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-meyah-terracota-500 hover:shadow-md"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-meyah-terracota-50 text-meyah-terracota-500">
                  <Building2 size={20} />
                </span>
                <span className="flex-1">
                  <b className="block font-display text-[18px] font-semibold leading-tight text-meyah-jade-900">
                    Quiero contratar
                  </b>
                  <span className="mt-0.5 block text-[13px] text-meyah-tinta-600">
                    Publicaré las vacantes de mi negocio
                  </span>
                </span>
                <ArrowRight
                  size={17}
                  className="flex-none text-meyah-tinta-400 transition group-hover:translate-x-0.5 group-hover:text-meyah-terracota-500"
                />
              </button>
              */}
            </div>

            <div className="mt-[26px] flex flex-col lg:mt-auto lg:pt-[30px]">
              <Button variant="ghost" asChild className="self-center">
                <Link to="/login">Ya tengo cuenta · Inicia sesión</Link>
              </Button>
            </div>
          </div>
        )}

        {/* ── Paso "Tu zona" (solo candidato) ── */}
        {step === 'zona' && (
          <div className="flex flex-col lg:flex-1" style={riseStyle}>
            <button type="button" onClick={() => setStep('rol')} className={backBtn}>
              <ArrowLeft size={15} /> Atrás
            </button>

            <div>
              <span className="eyebrow">Tu zona</span>
              <h1 className={stepH1}>¿Dónde<br />está tu casa?</h1>
              <p className={copyP}>
                Arrastra el pin al lugar donde vives o busca tu dirección. Usaremos esa ubicación
                para mostrarte empleo realmente cerca, sin perder horas en el tráfico.
              </p>
            </div>

            <div className="mt-6">
              <AuthInput
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleAddressSearch()
                  }
                }}
                placeholder="Busca tu calle o colonia…"
                icon={<Search size={16} />}
                trailing={
                  <button
                    type="button"
                    onClick={() => void handleAddressSearch()}
                    disabled={searching}
                    className="flex-none text-[13px] font-semibold text-meyah-jade-700 disabled:opacity-50"
                  >
                    {searching ? 'Buscando…' : 'Buscar'}
                  </button>
                }
              />
            </div>

            <div className="mt-4 flex items-center gap-3.5 rounded-card border border-meyah-border-soft bg-white px-[18px] py-4 shadow-xs">
              <div className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-meyah-terracota-50 text-meyah-terracota-500">
                <MapPin size={20} />
              </div>
              <div>
                <span className="block text-[12px] text-meyah-tinta-400">Tu zona aproximada</span>
                <b className="font-display text-[18px] font-semibold text-meyah-jade-900">{zonaLabel}</b>
              </div>
            </div>

            <div className="mt-[22px]">
              <div className="mb-3 flex items-baseline justify-between">
                <label htmlFor="radio" className={lbl}>Radio de búsqueda</label>
                <b className="font-display text-[20px] font-semibold text-meyah-jade-700">{radio} km</b>
              </div>
              <input
                id="radio"
                className="meyah-range"
                type="range"
                min={1}
                max={20}
                step={1}
                value={radio}
                onChange={e => setValue('radio_busqueda_km', Number(e.target.value), { shouldValidate: true })}
              />
              <div className="mt-3.5 flex items-center gap-[7px] text-[13px] text-meyah-tinta-600">
                <Route size={14} className="flex-none text-meyah-jade-600" />
                <span>
                  Verás primero lo que esté a{' '}
                  <b className="font-semibold text-meyah-jade-700">{radio} km</b> · ~{radio * 12} min a pie
                </span>
              </div>
            </div>

            <div className="mt-[26px] flex flex-col gap-2 lg:mt-auto lg:pt-[30px]">
              <Button type="button" size="lg" className="w-full" onClick={() => setStep('perfil')}>
                Continuar <ArrowRight />
              </Button>
            </div>
          </div>
        )}

        {/* ── Paso "Tu perfil" ── */}
        {step === 'perfil' && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col lg:flex-1"
            style={riseStyle}
          >
            <button
              type="button"
              onClick={() => setStep(esCandidato ? 'zona' : 'rol')}
              className={backBtn}
            >
              <ArrowLeft size={15} /> Atrás
            </button>

            <div>
              <span className="eyebrow">Casi listo</span>
              <h1 className={stepH1}>Cuéntanos<br />de ti</h1>
              <p className={copyP}>
                {esCandidato
                  ? 'Solo lo esencial. Sin CV ni pruebas — los empleadores cercanos verán tu nombre y lo que buscas.'
                  : 'Solo lo esencial para crear tu cuenta. Después registrarás tu empresa y publicarás tu primera vacante.'}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-[18px]">
              <label className="flex flex-col gap-2">
                <span className={lbl}>Nombre completo</span>
                <AuthInput
                  type="text"
                  placeholder="Ej. Ana López"
                  autoComplete="name"
                  aria-invalid={!!errors.nombre}
                  {...register('nombre')}
                />
                {errors.nombre && <span className={err}>{errors.nombre.message}</span>}
              </label>

              <label className="flex flex-col gap-2">
                <span className={lbl}>Correo electrónico</span>
                <AuthInput
                  type="email"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && <span className={err}>{errors.email.message}</span>}
              </label>

              <label className="flex flex-col gap-2">
                <span className={lbl}>Contraseña</span>
                <AuthInput
                  type={show ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShow(s => !s)}
                      className="flex-none text-[13px] font-semibold text-meyah-jade-700"
                    >
                      {show ? 'Ocultar' : 'Ver'}
                    </button>
                  }
                  {...register('password')}
                />
                {errors.password && <span className={err}>{errors.password.message}</span>}
              </label>

              <label className="flex flex-col gap-2">
                <span className={lbl}>Teléfono</span>
                <AuthInput
                  type="tel"
                  inputMode="tel"
                  placeholder="999 000 0000"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  {...register('phone')}
                />
                <span className="text-[12px] text-meyah-tinta-400">
                  {esCandidato ? 'Los empleadores te contactarán aquí.' : 'Para avisarte sobre tus vacantes.'}
                </span>
                {errors.phone && <span className={err}>{errors.phone.message}</span>}
              </label>

              {esCandidato && (
                <>
                  <div className="flex flex-col gap-2">
                    <span className={lbl}>
                      ¿Qué tipo de empleo buscas? <em className={opcional}>(opcional)</em>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {JOB_CATEGORIES.map(c => {
                        const Icon = ICON_BY_CATEGORY[c.value]
                        const on = categorias.includes(c.value)
                        return (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => toggleCategoria(c.value)}
                            className={cn(
                              chipBase,
                              on ? 'border-meyah-jade-900 bg-meyah-jade-900 text-white' : chipOff,
                            )}
                          >
                            <Icon size={15} className={on ? undefined : 'opacity-80'} /> {c.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className={lbl}>
                      Disponibilidad <em className={opcional}>(opcional)</em>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {JOB_SCHEDULES.map(s => {
                        const on = disponibilidad === s.value
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setValue('disponibilidad', on ? null : s.value, { shouldValidate: true })}
                            className={cn(
                              chipBase,
                              on
                                ? 'border-meyah-jade-500 bg-meyah-jade-50 text-meyah-jade-700'
                                : chipOff,
                            )}
                          >
                            {s.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-[26px] flex flex-col gap-2 lg:mt-auto lg:pt-[30px]">
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creando tu cuenta…' : 'Crear mi cuenta'} <ArrowRight />
              </Button>
            </div>
          </form>
        )}

        {/* ── Paso "¡Listo!" ── */}
        {step === 'listo' && (
          <div
            className="flex flex-col lg:flex-1"
            style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}
          >
            <div
              className="grid h-[72px] w-[72px] place-items-center rounded-full bg-meyah-jade-50 text-meyah-jade-600"
              style={{ animation: 'heartPop .5s cubic-bezier(.2,.7,.3,1)' }}
            >
              <Check size={34} strokeWidth={2.4} />
            </div>

            <div className="mt-[22px]">
              <span className="eyebrow">Cuenta creada</span>
              <h1 className={stepH1}>{firstName ? `¡Listo, ${firstName}!` : '¡Todo listo!'}</h1>
              <p className={copyP}>
                {session
                  ? esCandidato
                    ? 'Tu cuenta está activa. Encontramos tu zona en el mapa — empieza a explorar las vacantes cerca.'
                    : 'Tu cuenta está activa. Registra tu empresa y publica tu primera vacante.'
                  : 'Tu cuenta está creada. Te enviamos un correo de confirmación: ábrelo y después inicia sesión.'}
              </p>
            </div>

            <div className="mt-[26px] flex flex-col gap-2.5">
              {resumen.map(({ icon: Icon, valor, detalle, hl }) => (
                <div
                  key={detalle}
                  className={cn(
                    'flex items-center gap-3.5 rounded-card border px-[18px] py-3.5 shadow-xs',
                    hl ? 'border-meyah-jade-900 bg-meyah-jade-900' : 'border-meyah-border-soft bg-white',
                  )}
                >
                  <div
                    className={cn(
                      'grid h-10 w-10 flex-none place-items-center rounded-[11px]',
                      hl ? 'bg-white/15 text-white' : 'bg-meyah-jade-50 text-meyah-jade-700',
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <b
                      className={cn(
                        'truncate font-display text-[19px] font-semibold leading-[1.05]',
                        hl ? 'text-white' : 'text-meyah-jade-900',
                      )}
                    >
                      {valor}
                    </b>
                    <span className={cn('text-[12.5px] leading-[1.1]', hl ? 'text-white/70' : 'text-meyah-tinta-400')}>
                      {detalle}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-[26px] flex flex-col gap-2 lg:mt-auto lg:pt-[30px]">
              {session ? (
                <Button size="lg" className="w-full" onClick={() => void navigate(esCandidato ? '/inicio' : '/dashboard')}>
                  {esCandidato ? 'Explorar empleos cerca' : 'Ir a mi panel'} <ArrowRight />
                </Button>
              ) : (
                <>
                  <Button size="lg" className="w-full" asChild>
                    <Link to="/login">Ir a iniciar sesión <ArrowRight /></Link>
                  </Button>
                  <button
                    type="button"
                    onClick={() => void resendEmail()}
                    className="mt-1 text-center text-[13.5px] font-semibold text-meyah-jade-700 transition-colors hover:text-meyah-jade-900"
                  >
                    ¿No te llegó el correo? Reenviar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── Mapa (siempre visible en desktop; en móvil solo en "Tu zona",
            donde es la interacción principal) ── */}
      <div
        className={cn(
          'relative lg:order-none lg:block lg:h-full lg:p-4',
          step === 'zona' ? 'order-first block h-[56vh] min-h-[360px]' : 'hidden',
        )}
      >
        <div className="h-full overflow-hidden lg:rounded-panel lg:border lg:border-meyah-border-soft lg:shadow-md">
          <ZonePicker
            lat={lat}
            lng={lng}
            radiusKm={radio}
            onChange={movePin}
            locked={step !== 'zona'}
            showRadius={tipo !== 'empleador'}
            resizeKey={step}
          />
        </div>

        {step === 'zona' && !moved && (
          <div
            className={cn(hintPill, 'bg-meyah-jade-900')}
            style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}
          >
            <MapPin size={16} className="text-meyah-terracota-100" /> Arrastra el pin a tu colonia
          </div>
        )}
        {step === 'listo' && esCandidato && (
          <div
            className={cn(hintPill, 'bg-meyah-jade-700')}
            style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}
          >
            <Check size={14} className="box-content rounded-full bg-meyah-jade-500 p-[2px] text-white" />
            Tu zona quedó guardada
          </div>
        )}
      </div>
    </div>
  )
}
