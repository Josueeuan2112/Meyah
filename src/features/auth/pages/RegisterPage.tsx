import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Building2, Loader2, Search } from 'lucide-react'

import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import AuthBackground from '@/shared/components/AuthBackground'

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
    <main className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <AuthBackground />

      <div className="relative z-10 max-w-md mx-auto w-full">

        {/* Header fuera del card */}
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-meyah-terracota-700">
            CREAR CUENTA
          </span>
          <h1 className="font-display text-3xl md:text-4xl text-meyah-jade-900 mt-3 leading-tight">
            Únete a Meyah
          </h1>
          <p className="text-base text-meyah-tinta-600 mt-3">
            Trabajo cerca de casa, en Mérida.
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-meyah-crema-100 border border-meyah-tinta-600/15 rounded-xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/*  Selector de tipo  */}
            <div>
              <Label className="text-sm font-semibold text-meyah-tinta-900 mb-3 block">
                ¿Qué buscas?
              </Label>

              <div className="grid grid-cols-2 gap-3">
                {/* Tarjeta: candidato */}
                <button
                  type="button"
                  onClick={() => setValue('tipo', 'candidato', { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-4 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-meyah-jade-500',
                    selectedTipo === 'candidato'
                      ? 'bg-meyah-jade-50 border-meyah-jade-500 ring-2 ring-meyah-jade-500/20'
                      : 'bg-meyah-crema-50 border-meyah-tinta-600/20 hover:border-meyah-jade-500/40 hover:bg-meyah-jade-50/30'
                  )}
                >
                  <Search
                    className={cn(
                      'w-5 h-5',
                      selectedTipo === 'candidato' ? 'text-meyah-jade-700' : 'text-meyah-tinta-600'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold mt-2',
                      selectedTipo === 'candidato' ? 'text-meyah-jade-700' : 'text-meyah-tinta-900'
                    )}
                  >
                    Busco empleo
                  </span>
                  <span className="text-xs text-meyah-tinta-600 mt-1">Soy candidato</span>
                </button>

                {/* Tarjeta: empleador */}
                <button
                  type="button"
                  onClick={() => setValue('tipo', 'empleador', { shouldValidate: true })}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-4 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-meyah-jade-500',
                    selectedTipo === 'empleador'
                      ? 'bg-meyah-jade-50 border-meyah-jade-500 ring-2 ring-meyah-jade-500/20'
                      : 'bg-meyah-crema-50 border-meyah-tinta-600/20 hover:border-meyah-jade-500/40 hover:bg-meyah-jade-50/30'
                  )}
                >
                  <Building2
                    className={cn(
                      'w-5 h-5',
                      selectedTipo === 'empleador' ? 'text-meyah-jade-700' : 'text-meyah-tinta-600'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold mt-2',
                      selectedTipo === 'empleador' ? 'text-meyah-jade-700' : 'text-meyah-tinta-900'
                    )}
                  >
                    Quiero contratar
                  </span>
                  <span className="text-xs text-meyah-tinta-600 mt-1">Soy empleador</span>
                </button>
              </div>

              {errors.tipo && (
                <p className="text-xs text-meyah-terracota-700 mt-1">{errors.tipo.message}</p>
              )}
            </div>

            {/*  Campos del formulario  */}
            <div className="mt-5 space-y-4">

              {/* Nombre */}
              <div>
                <Label htmlFor="nombre" className="text-sm font-medium text-meyah-tinta-900">
                  Nombre completo
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  aria-invalid={!!errors.nombre}
                  className="mt-1"
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <p className="text-xs text-meyah-terracota-700 mt-1">{errors.nombre.message}</p>
                )}
              </div>

              {/* Email */}
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

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-meyah-tinta-900">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  aria-invalid={!!errors.password}
                  className="mt-1"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-meyah-terracota-700 mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirmar password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-meyah-tinta-900">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  aria-invalid={!!errors.confirmPassword}
                  className="mt-1"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-meyah-terracota-700 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

            </div>

            {/*  Submit  */}
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-6 w-full bg-meyah-jade-500 hover:bg-meyah-jade-700 text-white hover:scale-[1.01] transition-all duration-200"
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

          {/* ── Link al login ──── */}
          <p className="mt-5 text-center text-sm text-meyah-tinta-600">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="text-meyah-jade-700 hover:text-meyah-jade-900 font-medium transition-colors"
            >
              Inicia sesión
            </Link>
          </p>

        </div>
      </div>
    </main>
  )
}
