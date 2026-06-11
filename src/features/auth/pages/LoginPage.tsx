import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowRight, Mail } from 'lucide-react'

import { loginSchema, type LoginFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

function Wordmark({ className }: { className?: string }) {
  return (
    <div className={className}>
      Meyah<span className="h-1.5 w-1.5 self-center rounded-full bg-meyah-terracota-500" />
    </div>
  )
}

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await signIn(data.email, data.password)

    if (error) {
      // Mensaje genérico intencional: no revelar si el correo existe o no
      toast.error('Correo o contraseña incorrectos')
      return
    }

    toast.success('¡Bienvenido de nuevo!')
    navigate('/inicio')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* Panel izquierdo: marca (solo desktop) */}
      <div className="greca relative hidden flex-col justify-between overflow-hidden bg-meyah-jade-900 p-12 text-white lg:flex">
        <Wordmark className="flex items-baseline gap-0.75 font-display text-[26px] font-semibold text-white" />

        <div>
          <h2 className="font-display text-[clamp(34px,4vw,52px)] leading-[1.02] tracking-[-0.02em] text-white">
            Trabajo<br />cerca de casa.
          </h2>
          <p className="mt-4 max-w-90 text-[15.5px] leading-[1.6] text-white/75">
            Vuelve a tu mapa y descubre las vacantes nuevas que se publicaron en tu zona.
          </p>
          <div className="mt-8 aspect-4/3 max-w-105 overflow-hidden rounded-panel border border-white/15 bg-white/6" />
        </div>

        <p className="text-[13px] text-white/55">Hecho en Mérida, Yucatán</p>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-[400px]">

          {/* Wordmark jade (solo móvil, panel izquierdo oculto) */}
          <div className="mb-8 lg:hidden">
            <Wordmark className="flex items-baseline gap-0.75 font-display text-[24px] font-semibold text-meyah-jade-700" />
          </div>

          <span className="eyebrow">Te damos la bienvenida</span>
          <h1 className="mt-1 text-[clamp(28px,4vw,36px)]">Inicia sesión</h1>
          <p className="mt-2 text-[15px] text-meyah-tinta-600">
            Entra para ver empleo cerca de ti en Mérida.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 flex flex-col gap-4">

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
                  placeholder="Tu contraseña"
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

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'} <ArrowRight />
            </Button>
          </form>

          <p className="mt-6 text-center text-[14px] text-meyah-tinta-600">
            ¿No tienes cuenta? <Link to="/registro" className="font-semibold text-meyah-jade-700 hover:underline">Créala gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
