import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Building2, Loader2, Search } from 'lucide-react'

import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/shared/lib/utils'
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

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

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
  // lo que nos permite reflejar el estilo "seleccionado" en las tarjetas
  const selectedTipo = watch('tipo')

  const onSubmit = async (data: RegisterFormData) => {
    const { error } = await signUp({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      tipo: data.tipo,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Cuenta creada. Revisa tu correo para confirmar.')
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-meyah-crema-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-meyah-crema-100 shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-meyah-jade-700">
            Crea tu cuenta
          </CardTitle>
          <CardDescription className="text-meyah-tinta-600">
            Encuentra trabajo cerca de tu casa
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* ── Selector de tipo ─────────────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-meyah-tinta-900 font-medium">
                ¿Qué estás buscando?
              </Label>

              <div className="grid grid-cols-2 gap-3">
                {/* Tarjeta: candidato */}
                <button
                  type="button"
                  onClick={() => setValue('tipo', 'candidato', { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-meyah-jade-500',
                    selectedTipo === 'candidato'
                      ? 'border-meyah-jade-500 bg-meyah-jade-50 shadow-sm'
                      : 'border-meyah-crema-100 bg-white hover:border-meyah-jade-300 hover:bg-meyah-jade-50/40'
                  )}
                >
                  <Search
                    className={cn(
                      'size-8',
                      selectedTipo === 'candidato'
                        ? 'text-meyah-jade-600'
                        : 'text-meyah-tinta-600'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      selectedTipo === 'candidato'
                        ? 'text-meyah-jade-700'
                        : 'text-meyah-tinta-900'
                    )}
                  >
                    Busco empleo
                  </span>
                  <span className="text-xs text-meyah-tinta-600 text-center leading-snug">
                    Encuentra vacantes cerca de ti
                  </span>
                </button>

                {/* Tarjeta: empleador */}
                <button
                  type="button"
                  onClick={() => setValue('tipo', 'empleador', { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-meyah-jade-500',
                    selectedTipo === 'empleador'
                      ? 'border-meyah-jade-500 bg-meyah-jade-50 shadow-sm'
                      : 'border-meyah-crema-100 bg-white hover:border-meyah-jade-300 hover:bg-meyah-jade-50/40'
                  )}
                >
                  <Building2
                    className={cn(
                      'size-8',
                      selectedTipo === 'empleador'
                        ? 'text-meyah-jade-600'
                        : 'text-meyah-tinta-600'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      selectedTipo === 'empleador'
                        ? 'text-meyah-jade-700'
                        : 'text-meyah-tinta-900'
                    )}
                  >
                    Quiero contratar
                  </span>
                  <span className="text-xs text-meyah-tinta-600 text-center leading-snug">
                    Publica vacantes y encuentra talento
                  </span>
                </button>
              </div>

              {errors.tipo && (
                <p className="text-xs text-meyah-terracota-500">{errors.tipo.message}</p>
              )}
            </div>

            {/* ── Nombre ───────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-meyah-tinta-900">
                Nombre completo
              </Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Tu nombre"
                aria-invalid={!!errors.nombre}
                {...register('nombre')}
              />
              {errors.nombre && (
                <p className="text-xs text-meyah-terracota-500">{errors.nombre.message}</p>
              )}
            </div>

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
                placeholder="Mínimo 8 caracteres"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-meyah-terracota-500">{errors.password.message}</p>
              )}
            </div>

            {/* ── Confirmar password ───────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-meyah-tinta-900">
                Confirmar contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                aria-invalid={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-meyah-terracota-500">
                  {errors.confirmPassword.message}
                </p>
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
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pt-0">
          <p className="text-sm text-meyah-tinta-600">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="text-meyah-jade-700 underline underline-offset-4 hover:text-meyah-jade-900 transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
