import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { loginSchema, type LoginFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

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
    <main className="min-h-screen bg-meyah-crema-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-meyah-crema-100 shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-meyah-jade-700">
            Inicia sesión
          </CardTitle>
          <CardDescription className="text-meyah-tinta-600">
            Bienvenido de vuelta a Meyah
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* ── Email ────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-meyah-tinta-900">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-meyah-terracota-500">{errors.email.message}</p>
              )}
            </div>

            {/* ── Password ─────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-meyah-tinta-900">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-meyah-terracota-500">{errors.password.message}</p>
              )}
            </div>

            {/* ── Submit ───────────────────────────────────────────── */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-meyah-jade-500 hover:bg-meyah-jade-700 text-white"
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
        </CardContent>

        <CardFooter className="justify-center pt-0">
          <p className="text-sm text-meyah-tinta-600">
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="text-meyah-jade-700 underline underline-offset-4 hover:text-meyah-jade-900 transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
