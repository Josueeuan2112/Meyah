import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { loginSchema, type LoginFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import AuthBackground from '@/shared/components/AuthBackground'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

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
    <main className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <AuthBackground />

      <div className="relative z-10 max-w-md mx-auto w-full">

        {/* Header fuera del card */}
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-meyah-terracota-700">
            BIENVENIDO DE VUELTA
          </span>
          <h1 className="font-display text-3xl md:text-4xl text-meyah-jade-900 mt-3 leading-tight">
            Inicia sesión
          </h1>
          <p className="text-base text-meyah-tinta-600 mt-3">
            Acceso a tus vacantes y postulaciones.
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-meyah-crema-100 border border-meyah-tinta-600/15 rounded-xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* ── Email ────────────────────────────────────────────── */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-meyah-tinta-900">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                aria-invalid={!!errors.email}
                className="mt-1"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-meyah-terracota-700 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* ── Password ─────────────────────────────────────────── */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-meyah-tinta-900">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                aria-invalid={!!errors.password}
                className="mt-1"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-meyah-terracota-700 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* ── Submit ───────────────────────────────────────────── */}
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-2 w-full bg-meyah-jade-500 hover:bg-meyah-jade-700 text-white hover:scale-[1.01] transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>

          </form>

          {/* ── Link al registro ──────────────────────────────────── */}
          <p className="mt-5 text-center text-sm text-meyah-tinta-600">
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="text-meyah-jade-700 hover:text-meyah-jade-900 font-medium transition-colors"
            >
              Regístrate
            </Link>
          </p>

        </div>
      </div>
    </main>
  )
}
