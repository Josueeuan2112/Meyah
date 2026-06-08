import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { applicationSchema } from '@/features/applications/schemas/application.schema'
import type { ApplicationSchemaInput, ApplicationSchemaOutput } from '@/features/applications/schemas/application.schema'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { Label } from '@/shared/ui/label'

interface ApplyFormProps {
  onSubmit: (values: ApplicationSchemaOutput) => void | Promise<void>
  isSubmitting: boolean
}

export default function ApplyForm({ onSubmit, isSubmitting }: ApplyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationSchemaInput, unknown, ApplicationSchemaOutput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { mensaje: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

      <div>
        <Label htmlFor="mensaje" className="text-sm font-medium text-meyah-tinta-900">
          Mensaje (opcional)
        </Label>
        <Textarea
          id="mensaje"
          rows={4}
          className="mt-1 resize-none"
          aria-invalid={!!errors.mensaje}
          {...register('mensaje')}
        />
        {errors.mensaje && (
          <p className="text-xs text-meyah-terracota-700 mt-1">{errors.mensaje.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto bg-meyah-jade-500 hover:bg-meyah-jade-700 text-white"
      >
        {isSubmitting ? 'Enviando...' : 'Postularme'}
      </Button>

    </form>
  )
}
