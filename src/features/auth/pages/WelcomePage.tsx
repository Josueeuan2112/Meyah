// Distribuidor post-login:
//   - Empleador → redirige a /dashboard (su área de trabajo)
//   - Candidato → muestra tarjeta de bienvenida (placeholder hasta Etapa 6)

import { Navigate, useNavigate } from 'react-router'
import { Loader2, LogOut } from 'lucide-react'

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

const TIPO_LABEL: Record<'empleador' | 'candidato', string> = {
  empleador: 'Empleador',
  candidato: 'Candidato en búsqueda de empleo',
}

export default function WelcomePage() {
  const { profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // Sesión en verificación inicial
  if (loading) {
    return (
      <main className="min-h-screen bg-meyah-crema-50 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-meyah-jade-500" />
      </main>
    )
  }

  // Loading terminó pero el profile aún no llegó
  // (puede ocurrir los primeros instantes tras el registro, mientras el trigger de BD escribe)
  if (!profile) {
    return (
      <main className="min-h-screen bg-meyah-crema-50 flex items-center justify-center">
        <p className="text-meyah-tinta-600">Cargando perfil...</p>
      </main>
    )
  }

  // Empleador → dashboard. replace evita que /inicio quede en el historial
  // y cause un loop con el botón atrás del navegador.
  if (profile.tipo === 'empleador') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="min-h-screen bg-meyah-crema-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-meyah-crema-100 shadow-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-meyah-jade-700">
            ¡Bienvenido, {profile.nombre}!
          </CardTitle>
          <CardDescription className="text-meyah-tinta-600">
            {TIPO_LABEL[profile.tipo]}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-meyah-tinta-600">
            Tu cuenta está lista. Pronto podrás explorar vacantes cerca de ti en el mapa.
          </p>
        </CardContent>

        <CardFooter className="justify-center">
          <Button
            variant="outline"
            className="border-meyah-tinta-600/30 text-meyah-tinta-600 hover:bg-meyah-crema-100 hover:text-meyah-tinta-900"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
