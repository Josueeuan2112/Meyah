import { Link } from 'react-router'
import { ArrowRight, FileText } from 'lucide-react'

import { useMyApplications } from '@/features/applications/hooks/useMyApplications'
import { ApplicationCard } from '@/features/applications/components/ApplicationCard'
import { Button } from '@/shared/ui/button'

export default function MyApplicationsPage() {
  const { data, isLoading, isError } = useMyApplications()

  // Estado: cargando
  if (isLoading) {
    return (
      <div className="mx-auto max-w-295 px-4 pt-12 pb-22.5 sm:px-6">
        <span className="eyebrow">Tus candidaturas</span>
        <h1 className="mt-2.5 text-[clamp(30px,4vw,40px)]">Mis postulaciones</h1>
        <p className="mt-3 text-[15.5px] text-meyah-tinta-600">Da seguimiento a los empleos a los que aplicaste cerca de ti.</p>

        <div className="mt-8.5 flex flex-col gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex animate-pulse gap-4 rounded-card border border-meyah-border-soft bg-white p-5">
              <div className="h-12 w-12 flex-none rounded-[14px] bg-meyah-crema-100" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="h-3.5 w-2/3 rounded-full bg-meyah-crema-100" />
                <div className="h-3 w-1/2 rounded-full bg-meyah-crema-100" />
                <div className="mt-3.5 h-3 w-1/3 rounded-full border-t border-meyah-border-soft bg-meyah-crema-100 pt-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Estado: error
  if (isError) {
    return (
      <div className="flex items-center justify-center px-4 py-20">
        <p className="text-center text-meyah-tinta-600">
          No se pudieron cargar tus postulaciones. Intenta de nuevo.
        </p>
      </div>
    )
  }

  const apps = data ?? []

  return (
    <div className="mx-auto max-w-295 px-4 pt-12 pb-22.5 sm:px-6">
      <div style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards' }}>
        <span className="eyebrow">Tus candidaturas</span>
        <h1 className="mt-2.5 text-[clamp(30px,4vw,40px)]">Mis postulaciones</h1>
        <p className="mt-3 text-[15.5px] text-meyah-tinta-600">Da seguimiento a los empleos a los que aplicaste cerca de ti.</p>

        {apps.length === 0 ? (
          <div className="mt-8.5 flex flex-col items-center gap-3 rounded-panel border border-meyah-border-soft bg-white px-6 py-16 text-center">
            <div className="grid h-15 w-15 place-items-center rounded-panel bg-meyah-crema-100 text-meyah-tinta-400">
              <FileText size={26} />
            </div>
            <h3 className="text-[20px]">Aún no te has postulado</h3>
            <p className="max-w-70 text-[13.5px] text-meyah-tinta-600">
              Explora las vacantes cerca de ti y postúlate a la que más te convenga.
            </p>
            <Button asChild>
              <Link to="/inicio">Explorar vacantes <ArrowRight /></Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-8.5 flex flex-col gap-3.5">
              {apps.map((app, i) => (
                <div
                  key={app.id}
                  style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards', animationDelay: `${i * 40}ms` }}
                >
                  <ApplicationCard app={app} />
                </div>
              ))}
            </div>

            <div className="mt-8.5 flex flex-wrap items-center justify-between gap-3.5 rounded-panel bg-meyah-jade-50 p-6.5">
              <p className="font-display text-[19px] text-meyah-jade-900">¿Buscas más opciones cerca?</p>
              <Button asChild>
                <Link to="/inicio">Explorar vacantes <ArrowRight /></Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
