import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Mail, MailCheck } from 'lucide-react'

import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas/auth.schemas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AuthInput from '@/features/auth/components/AuthInput'
import { Button } from '@/shared/ui/button'

// /recuperar — paso 1 del reset: pedir el correo y mandar el enlace.
// El mensaje de éxito es deliberadamente neutro ("si existe una cuenta…")
// para no revelar qué correos están registrados.

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const { error } = await resetPassword(data.email)
    if (error) {
      // Único error que vale la pena distinguir: el rate limit de Supabase
      toast.error('No se pudo enviar el correo. Espera un momento e intenta de nuevo.')
      return
    }
    setSentTo(data.email)
  }

  const resend = async () => {
    if (!sentTo) return
    const { error } = await resetPassword(sentTo)
    if (error) {
      toast.error('No se pudo reenviar. Espera un momento e intenta de nuevo.')
      return
    }
    toast.success('Enlace reenviado')
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

        {sentTo ? (
          <div className="rounded-panel border border-meyah-border-soft bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-meyah-jade-50 text-meyah-jade-600">
              <MailCheck size={30} />
            </div>
            <h1 className="mt-5 text-[26px]">Revisa tu correo</h1>
            <p className="mt-3 text-[14.5px] leading-[1.6] text-meyah-tinta-600">
              Si existe una cuenta con <b className="text-meyah-tinta-900">{sentTo}</b>, recibirás
              un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.
            </p>
            <button
              type="button"
              onClick={() => void resend()}
              className="mt-5 text-[14px] font-semibold text-meyah-jade-700 hover:underline"
            >
              ¿No te llegó? Reenviar enlace
            </button>
            <p className="mt-6 border-t border-meyah-border-soft pt-5 text-[14px] text-meyah-tinta-600">
              <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-meyah-jade-700 hover:underline">
                <ArrowLeft size={15} /> Volver a iniciar sesión
              </Link>
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="rounded-panel border border-meyah-border-soft bg-white p-8 shadow-sm"
          >
            <span className="eyebrow">Recupera tu acceso</span>
            <h1 className="mt-2 text-[28px]">¿Olvidaste tu contraseña?</h1>
            <p className="mt-2.5 text-[14.5px] leading-[1.6] text-meyah-tinta-600">
              Escribe tu correo y te enviaremos un enlace para crear una nueva.
            </p>

            <label className="mt-6 flex flex-col gap-2">
              <span className="text-[13.5px] font-semibold text-meyah-tinta-900">Correo electrónico</span>
              <AuthInput
                type="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                icon={<Mail size={17} />}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <span className="text-[12.5px] text-meyah-terracota-700">{errors.email.message}</span>
              )}
            </label>

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando…' : 'Enviar enlace'} <ArrowRight />
            </Button>

            <p className="mt-6 text-center text-[14px] text-meyah-tinta-600">
              <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-meyah-jade-700 hover:underline">
                <ArrowLeft size={15} /> Volver a iniciar sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
