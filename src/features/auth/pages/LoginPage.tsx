import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowRight, Check, User } from 'lucide-react'

import { loginSchema, type LoginFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AuthInput from '@/features/auth/components/AuthInput'
import BrandMap from '@/shared/components/BrandMap'
import { Button } from '@/shared/ui/button'

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      Meyah<span className="h-1.5 w-1.5 self-center rounded-full bg-meyah-terracota-500" />
    </span>
  )
}

export default function LoginPage() {
  const { signIn, resendConfirmation } = useAuth()
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
      // Cuenta sin confirmar ≠ credenciales malas: con verificación de email
      // activa, Supabase responde "Email not confirmed". Decirlo claro y
      // ofrecer el reenvío evita el callejón "mi contraseña está bien y no entro".
      if (error.message.toLowerCase().includes('not confirmed')) {
        toast.error('Tu correo aún no está confirmado. Revisa tu bandeja o spam.', {
          action: {
            label: 'Reenviar',
            onClick: () => {
              void resendConfirmation(data.email).then(({ error: resendError }) => {
                if (resendError) toast.error('No se pudo reenviar. Intenta más tarde.')
                else toast.success('Correo de confirmación reenviado')
              })
            },
          },
        })
        return
      }
      // Mensaje genérico intencional: no revelar si el correo existe o no
      toast.error('Correo o contraseña incorrectos')
      return
    }

    toast.success('¡Bienvenido de nuevo!')
    navigate('/inicio')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* Panel de marca (solo desktop) */}
      <aside className="greca relative hidden flex-col overflow-hidden bg-meyah-jade-900 px-12 py-10 text-white lg:flex">
        <Link to="/" className="self-start">
          <Wordmark className="flex items-baseline gap-0.75 font-display text-[26px] font-semibold text-white" />
        </Link>

        <div className="mt-14">
          <h2 className="font-display text-[clamp(34px,4vw,50px)] leading-[1.0] tracking-[-0.03em] text-white">
            Trabajo<br />cerca de casa.
          </h2>
          <p className="mt-[18px] max-w-[360px] text-[16px] leading-[1.6] text-white/75">
            Vuelve a tu mapa y descubre las vacantes nuevas que se publicaron en tu zona.
          </p>
        </div>

        <div className="mt-[38px] min-h-[220px] flex-1 overflow-hidden rounded-panel border border-white/15 shadow-lg">
          <BrandMap variant="dark" />
        </div>

        <p className="mt-7 text-[13px] text-white/50">Hecho en Mérida, Yucatán</p>
      </aside>

      {/* Formulario */}
      <div className="flex items-start justify-center px-7 pb-10 pt-12 lg:items-center lg:py-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex w-full max-w-[400px] flex-col"
          style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}
        >
          {/* Wordmark (solo móvil: el panel de marca está oculto) */}
          <Link to="/" className="mb-6 self-start lg:hidden">
            <Wordmark className="flex items-baseline gap-0.75 font-display text-[24px] font-semibold text-meyah-jade-900" />
          </Link>

          <span className="eyebrow">Te damos la bienvenida</span>
          <h1 className="mt-2.5 text-[34px]">Inicia sesión</h1>
          <p className="mb-[26px] mt-2.5 text-[15px] text-meyah-tinta-600">
            Entra para ver empleo cerca de ti en Mérida.
          </p>

          <label className="mb-4 flex flex-col gap-2">
            <span className="text-[13.5px] font-semibold text-meyah-tinta-900">Correo electrónico</span>
            <AuthInput
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              icon={<User size={17} />}
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <span className="text-[12.5px] text-meyah-terracota-700">{errors.email.message}</span>
            )}
          </label>

          <label className="mb-4 flex flex-col gap-2">
            <span className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-semibold text-meyah-tinta-900">Contraseña</span>
              <Link
                to="/recuperar"
                className="text-[13px] font-semibold text-meyah-tinta-600 transition-colors hover:text-meyah-jade-700"
              >
                ¿La olvidaste?
              </Link>
            </span>
            <AuthInput
              type={show ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              icon={<Check size={17} />}
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
            {errors.password && (
              <span className="text-[12.5px] text-meyah-terracota-700">{errors.password.message}</span>
            )}
          </label>

          <Button type="submit" size="lg" className="mt-2.5 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : 'Entrar'} <ArrowRight />
          </Button>

          <p className="mt-6 text-center text-[14px] text-meyah-tinta-600">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-meyah-jade-700 hover:underline">
              Créala gratis
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
