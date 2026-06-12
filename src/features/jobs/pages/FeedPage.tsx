import { useState } from 'react'
import { Link } from 'react-router'
import { MapPin, Search, X, Map as MapIcon, List } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNearbyJobs } from '@/features/jobs/hooks/useNearbyJobs'
import NearbyJobCard from '@/features/jobs/components/NearbyJobCard'
import FeedMap from '@/features/jobs/components/FeedMap'
import JobSheet from '@/features/jobs/components/JobSheet'
import { JOB_CATEGORIES, ICON_BY_CATEGORY } from '@/features/jobs/schemas/categories'
import type { JobCategoryValue } from '@/features/jobs/schemas/categories'
import { Button } from '@/shared/ui/button'

export default function FeedPage() {
  const { profile } = useAuth()
  const { data, isPending, isError } = useNearbyJobs()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<JobCategoryValue | 'todas'>('todas')
  const [selected, setSelected] = useState<{ id: string; distanciaM: number | null } | null>(null)
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)

  const hasLocation = profile?.lat_referencia != null

  const filtered = (data ?? []).filter(job => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      query === '' ||
      job.titulo.toLowerCase().includes(query) ||
      job.company_nombre.toLowerCase().includes(query)
    const matchesCategory = category === 'todas' || job.categoria === category
    return matchesSearch && matchesCategory
  })

  const hasFilters = search.trim() !== '' || category !== 'todas'

  const clearFilters = () => {
    setSearch('')
    setCategory('todas')
  }

  return (
    <div className="relative mx-auto max-w-700 lg:grid lg:grid-cols-[minmax(420px,0.92fr)_1.08fr]">
      {/* ===== Columna lista ===== */}
      <section className="flex min-h-0 flex-col lg:border-r lg:border-meyah-border-soft">
        <div className="border-b border-meyah-border-soft bg-meyah-crema-50 px-4 pt-4.5 pb-2 sm:px-6.5 sm:pt-5.5 lg:sticky lg:top-20 lg:z-30">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <span className="eyebrow">Cerca de ti · Mérida</span>
              <h1 className="mt-1 text-[23px] sm:text-[26px]">Vacantes a tu alcance</h1>
            </div>
            <span className="shrink-0 rounded-full bg-meyah-jade-50 px-3.25 py-1.5 text-[13px] font-semibold text-meyah-jade-700">
              {filtered.length} cerca
            </span>
          </div>

          {/* Buscador */}
          <div className="mb-3.5 flex items-center gap-2.75 rounded-full border border-meyah-border bg-white px-4.5 py-3 shadow-sm focus-within:border-meyah-jade-500 focus-within:ring-[3px] focus-within:ring-meyah-jade-500/15">
            <Search size={19} className="flex-none text-meyah-tinta-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Busca por puesto o empresa…"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-meyah-tinta-900 outline-none placeholder:text-meyah-tinta-400"
            />
            {search !== '' && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="grid h-6.5 w-6.5 flex-none place-items-center rounded-full bg-meyah-crema-100 text-meyah-tinta-600 hover:bg-meyah-border"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categorías */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
            <button
              type="button"
              onClick={() => setCategory('todas')}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
                category === 'todas'
                  ? 'border-meyah-jade-500 bg-meyah-jade-50 text-meyah-jade-900'
                  : 'border-meyah-border bg-white text-meyah-tinta-600 hover:border-meyah-jade-500/40'
              }`}
            >
              Todas
            </button>
            {JOB_CATEGORIES.map(c => {
              const Icon = ICON_BY_CATEGORY[c.value]
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
                    category === c.value
                      ? 'border-meyah-jade-500 bg-meyah-jade-50 text-meyah-jade-900'
                      : 'border-meyah-border bg-white text-meyah-tinta-600 hover:border-meyah-jade-500/40'
                  }`}
                >
                  <Icon size={14} /> {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Banner sin ubicación */}
        {!hasLocation && (
          <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-card border border-meyah-border-soft bg-meyah-jade-50/60 px-4 py-3 text-[13.5px] text-meyah-jade-900 sm:mx-6.5">
            <MapPin size={16} className="flex-none text-meyah-jade-600" />
            <span>Agrega tu ubicación para ordenar por cercanía. <Link to="/mi-perfil" className="font-semibold underline">Agregar</Link></span>
          </div>
        )}

        {/* Aviso de radio activo: sin él, un radio chico parece "no hay vacantes" */}
        {hasLocation && profile?.radio_busqueda_km != null && (
          <p className="mx-4 mt-3 text-[12.5px] text-meyah-tinta-400 sm:mx-6.5">
            Mostrando vacantes a menos de <b className="text-meyah-tinta-600">{profile.radio_busqueda_km} km</b> de tu casa.{' '}
            <Link to="/mi-perfil" className="font-semibold text-meyah-jade-700 underline">Ajustar radio</Link>
          </p>
        )}

        {/* Estados de carga / error / vacío / datos */}
        {isPending ? (
          <div className="flex flex-col gap-3 px-4 pt-4.5 pb-28 sm:px-6.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex animate-pulse gap-4 rounded-card border border-meyah-border-soft bg-white p-4 sm:p-4.5">
                <div className="h-12 w-12 flex-none rounded-[14px] bg-meyah-crema-100" />
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <div className="h-3.5 w-3/4 rounded-full bg-meyah-crema-100" />
                  <div className="h-3 w-1/2 rounded-full bg-meyah-crema-100" />
                  <div className="h-3 w-1/3 rounded-full bg-meyah-crema-100" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="px-4 pt-4.5 text-[13.5px] text-meyah-terracota-700 sm:px-6.5">
            No pudimos cargar las vacantes. Intenta de nuevo más tarde.
          </p>
        ) : !data || data.length === 0 ? (
          <p className="px-4 pt-4.5 text-[13.5px] text-meyah-tinta-600 sm:px-6.5">
            Aún no hay vacantes publicadas. Vuelve pronto.
          </p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center gap-3 px-4 py-16 text-center sm:px-6.5">
            <div className="grid h-15 w-15 place-items-center rounded-panel bg-meyah-crema-100 text-meyah-tinta-400">
              <Search size={26} />
            </div>
            <h3 className="text-[20px]">Sin resultados</h3>
            <p className="max-w-70 text-[13.5px] text-meyah-tinta-600">
              No encontramos vacantes que coincidan con tu búsqueda o filtro.
            </p>
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 pt-4.5 pb-28 sm:px-6.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {filtered.map((job, i) => (
              <div
                key={job.id}
                style={{ animation: 'rise .5s cubic-bezier(.2,.7,.3,1) forwards', animationDelay: `${i * 40}ms` }}
              >
                <NearbyJobCard
                  job={job}
                  onSelect={() => setSelected({ id: job.id, distanciaM: job.distancia_m })}
                  isActive={job.id === hoveredJobId}
                  onHoverChange={h => setHoveredJobId(h ? job.id : null)}
                />
              </div>
            ))}
            <p className="pt-3.5 text-center text-[12.5px] text-meyah-tinta-400">
              Mostrando empleo formal en Mérida y alrededores.
            </p>
          </div>
        )}
      </section>

      {/* ===== Columna mapa (solo escritorio) ===== */}
      <section className="hidden lg:block">
        <div className="sticky top-20 h-[calc(100dvh-80px)]">
          <FeedMap
            jobs={filtered}
            userLat={profile?.lat_referencia ?? null}
            userLng={profile?.lng_referencia ?? null}
            onSelect={job => setSelected({ id: job.id, distanciaM: job.distancia_m })}
            hoveredJobId={hoveredJobId}
            onHover={setHoveredJobId}
          />
        </div>
      </section>

      {/* ===== FAB "Ver mapa" (solo móvil, mapa cerrado) ===== */}
      {!showMap && (
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="fixed bottom-20 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-meyah-jade-900 px-5 py-3 text-[14px] font-semibold text-white shadow-lg lg:hidden"
        >
          <MapIcon size={17} /> Ver mapa
        </button>
      )}

      {/* ===== Overlay de mapa a pantalla completa (solo móvil) ===== */}
      {showMap && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <FeedMap
            jobs={filtered}
            userLat={profile?.lat_referencia ?? null}
            userLng={profile?.lng_referencia ?? null}
            onSelect={job => setSelected({ id: job.id, distanciaM: job.distancia_m })}
            hoveredJobId={null}
            onHover={() => {}}
          />
          <button
            type="button"
            onClick={() => setShowMap(false)}
            className="absolute left-4 top-4 z-[1000] inline-flex items-center gap-1.5 rounded-full border border-meyah-border-soft bg-white px-4 py-2.5 text-[14px] font-semibold text-meyah-jade-900 shadow-lg"
          >
            <List size={16} /> Ver lista
          </button>
        </div>
      )}

      {selected && (
        <JobSheet
          jobId={selected.id}
          distanciaM={selected.distanciaM}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
