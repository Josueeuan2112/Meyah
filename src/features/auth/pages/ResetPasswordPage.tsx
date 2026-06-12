import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowRight, Check, KeyRound, Loader2 } from 'lucide-react'

import { resetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AuthInput from '@/features/auth/components/AuthInput'
import { Button } from '@/shared/ui/button'

// /restablecer — paso 2 del reset. El enlace del correo llega con el token de
// recuperación en la URL; supabase-js (detectSessionInUrl) lo intercambia por
// una sesión durante la carga. Por eso la lógica es:
//   loading  → spinner (aún no sabemos si el token era válido)
//   !session → el enlace era inválido o ya expiró
//   session  → formulario de nueva contraseña (updateUser)

export default function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    const { error } = await updatePassword(data.password)
    if (error) {
      // Caso típico: "New password should be different from the old password"
      toast.error(
        error.message.toLowerCase().includes('different')
          ? 'La nueva contraseña debe ser distinta a la anterior.'
          : 'No se pudo actualizar la contraseña. Intenta de nuevo.',
      )
      return
    }
    toast.success('¡Contraseña actualizada!')
    // La sesión de recuperación ya es una sesión normal; el guard de rol
    // manda al empleador a /dashboard desde /inicio automáticamente.
    void navigate('/inicio')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-meyah-crema-50 px-6 py-10">
      <div
        className="w-full max-w-[420px]"
        style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}
      >
        <Link to="/" className="mb-7 flex items-baseline gap-0.75 font-display text-[24px] font-semibold text-meyah-jade-900">
          Meyah<span className="h-1.5 w-1.5 self-center rounded-full bg-meyah-terracota-500" />
        </Link>

        {loading ? (
          <div className="grid place-items-center rounded-panel border border-meyah-border-soft bg-white p-14 shadow-sm">
            <Loader2 className="size-8 animate-spin text-meyah-jade-500" />
          </div>
        ) : !session ? (
          <div className="rounded-panel border border-meyah-border-soft bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-meyah-terracota-50 text-meyah-terracota-700">
              <KeyRound size={28} />
            </div>
            <h1 className="mt-5 text-[26px]">Enlace inválido o expirado</h1>
            <p className="mt-3 text-[14.5px] leading-[1.6] text-meyah-tinta-600">
              Los enlaces de recuperación caducan por seguridad y solo sirven una vez.
              Solicita uno nuevo para continuar.
            </p>
            <Button size="lg" className="mt-6 w-full" asChild>
              <Link to="/recuperar">Solicitar nuevo enlace <ArrowRight /></Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="rounded-panel border border-meyah-border-soft bg-white p-8 shadow-sm"
          >
            <span className="eyebrow">Último paso</span>
            <h1 className="mt-2 text-[28px]">Crea tu nueva contraseña</h1>
            <p className="mt-2.5 text-[14.5px] leading-[1.6] text-meyah-tinta-600">
              Elige una contraseña que no uses en otros sitios.
            </p>

            <label className="mt-6 flex flex-col gap-2">
              <span className="text-[13.5px] font-semibold text-meyah-tinta-900">Nueva contraseña</span>
              <AuthInput
                type={show ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
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

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Guardar contraseña'} <ArrowRight />
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
