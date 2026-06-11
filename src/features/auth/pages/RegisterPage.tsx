import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowRight, Mail } from 'lucide-react'

import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import LocationPicker from '@/features/jobs/components/LocationPicker'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

const MERIDA_CENTER: [number, number] = [20.9674, -89.5926]

function Wordmark({ className }: { className?: string }) {
  return (
    <div className={className}>
      Meyah<span className="h-1.5 w-1.5 self-center rounded-full bg-meyah-terracota-500" />
    </div>
  )
}

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // watch('tipo') re-renderiza el componente cada vez que cambia el valor,
  // lo que nos permite reflejar el estilo "seleccionado" en los botones
  const selectedTipo = watch('tipo')
  const lat = watch('lat_referencia') ?? MERIDA_CENTER[0]
  const lng = watch('lng_referencia') ?? MERIDA_CENTER[1]

  const onSubmit = async (data: RegisterFormData) => {
    const esCandidato = data.tipo === 'candidato'

    const { error } = await signUp({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      tipo: data.tipo,
      phone: data.phone,
      lat_referencia: esCandidato ? data.lat_referencia ?? null : null,
      lng_referencia: esCandidato ? data.lng_referencia ?? null : null,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Cuenta creada. Revisa tu correo para confirmar.')
    navigate('/login')
  }

  const roleButtonBase = 'rounded-card border p-4 text-left transition'

  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* Panel izquierdo: marca (solo desktop) */}
      <div className="greca relative hidden flex-col justify-between overflow-hidden bg-meyah-jade-900 p-12 text-white lg:flex">
        <Wordmark className="flex items-baseline gap-0.75 font-display text-[26px] font-semibold text-white" />

        <div>
          <h2 className="font-display text-[clamp(34px,4vw,52px)] leading-[1.02] tracking-[-0.02em] text-white">
            Empieza a buscar<br />cerca de casa.
          </h2>
          <p className="mt-4 max-w-90 text-[15.5px] leading-[1.6] text-white/75">
            Crea tu cuenta y descubre las vacantes que están a un paso de tu casa.
          </p>
          <div className="mt-8 aspect-4/3 max-w-105 overflow-hidden rounded-panel border border-white/15 bg-white/6" />
        </div>

        <p className="text-[13px] text-white/55">Hecho en Mérida, Yucatán</p>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-110">

          {/* Wordmark jade (solo móvil, panel izquierdo oculto) */}
          <div className="mb-8 lg:hidden">
            <Wordmark className="flex items-baseline gap-0.75 font-display text-[24px] font-semibold text-meyah-jade-700" />
          </div>

          <span className="eyebrow">Crea tu cuenta</span>
          <h1 className="mt-1 text-[clamp(28px,4vw,36px)]">Crea tu cuenta</h1>
          <p className="mt-2 text-[15px] text-meyah-tinta-600">
            Gratis, en un minuto. Sin CV ni pruebas.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 flex flex-col gap-4">

            {/* Selector de rol */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('tipo', 'candidato', { shouldValidate: true })}
                className={cn(
                  roleButtonBase,
                  selectedTipo === 'candidato'
                    ? 'border-meyah-jade-500 bg-meyah-jade-50'
                    : 'border-meyah-border bg-white hover:border-meyah-jade-500/40'
                )}
              >
                <span className="block text-[14px] font-semibold text-meyah-tinta-900">Busco empleo</span>
                <span className="block text-[12.5px] text-meyah-tinta-600">Soy candidato</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('tipo', 'empleador', { shouldValidate: true })}
                className={cn(
                  roleButtonBase,
                  selectedTipo === 'empleador'
                    ? 'border-meyah-jade-500 bg-meyah-jade-50'
                    : 'border-meyah-border bg-white hover:border-meyah-jade-500/40'
                )}
              >
                <span className="block text-[14px] font-semibold text-meyah-tinta-900">Quiero contratar</span>
                <span className="block text-[12.5px] text-meyah-tinta-600">Soy empresa</span>
              </button>
            </div>
            {errors.tipo && (
              <p className="text-[12.5px] text-meyah-terracota-700">{errors.tipo.message}</p>
            )}

            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                Nombre completo
              </Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Ej. Ana López"
                aria-invalid={!!errors.nombre}
                {...register('nombre')}
              />
              {errors.nombre && (
                <p className="text-[12.5px] text-meyah-terracota-700">{errors.nombre.message}</p>
              )}
            </div>

            {/* Correo */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-meyah-tinta-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  aria-invalid={!!errors.email}
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-[12.5px] text-meyah-terracota-700">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  aria-invalid={!!errors.password}
                  className="pr-20"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-meyah-jade-700"
                >
                  {show ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12.5px] text-meyah-terracota-700">{errors.password.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-[13.5px] font-semibold text-meyah-tinta-900">
                Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="999 000 0000"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              <p className="text-[12px] text-meyah-tinta-400">Los empleadores te contactarán aquí.</p>
              {errors.phone && (
                <p className="text-[12.5px] text-meyah-terracota-700">{errors.phone.message}</p>
              )}
            </div>

            {/* Ubicación (solo candidato) */}
            {selectedTipo === 'candidato' && (
              <div className="rounded-card border border-meyah-border-soft p-4">
                <p className="text-[13.5px] font-semibold text-meyah-tinta-900">¿Dónde está tu casa?</p>
                <p className="text-[12.5px] text-meyah-tinta-600">
                  La usamos para mostrarte empleo cerca. Puedes ajustarla después.
                </p>
                <div className="mt-3 h-60 overflow-hidden rounded-card border border-meyah-border-soft">
                  <LocationPicker
                    lat={lat}
                    lng={lng}
                    onChange={(newLat, newLng) => {
                      setValue('lat_referencia', newLat, { shouldValidate: true })
                      setValue('lng_referencia', newLng, { shouldValidate: true })
                    }}
                  />
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creando…' : 'Crear cuenta'} <ArrowRight />
            </Button>
          </form>

          <p className="mt-6 text-center text-[14px] text-meyah-tinta-600">
            ¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-meyah-jade-700 hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
