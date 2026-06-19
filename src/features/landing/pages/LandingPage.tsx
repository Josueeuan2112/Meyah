import { Link } from 'react-router'
import { ArrowRight, Building2, MapPin, Route, User } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import BrandMap from '@/shared/components/BrandMap'
import { JOB_CATEGORIES, ICON_BY_CATEGORY } from '@/features/jobs/schemas/categories'

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export default function LandingPage() {
  return (
    <div className="overflow-x-clip">
      {/* ===== NAV ===== */}
      <header className="sticky top-0 z-50 border-b border-transparent bg-meyah-crema-50/80 backdrop-blur-[12px]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-7 py-4">
          <Link to="/" className="flex items-baseline gap-[3px] font-display text-[26px] font-semibold tracking-[-0.02em] text-meyah-jade-700">
            Meyah<span className="h-1.5 w-1.5 self-center rounded-full bg-meyah-terracota-500" />
          </Link>
          <nav className="ml-3.5 hidden gap-2 md:flex">
            {[['como', 'Cómo funciona'], ['cats', 'Categorías'], ['empresas', 'Para empresas']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="rounded-full px-3 py-2 text-[14.5px] font-medium text-meyah-tinta-600 transition-colors hover:bg-meyah-crema-100 hover:text-meyah-jade-900">{label}</button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/login">Iniciar sesión</Link></Button>
            <Button asChild><Link to="/registro">Crear cuenta</Link></Button>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="mx-auto max-w-[1200px] px-5 pt-11 pb-[50px] md:px-7 md:pt-[70px] md:pb-[60px]">
        <div className="grid grid-cols-1 items-center gap-[70px] md:[grid-template-columns:1.04fr_0.96fr] md:gap-14">
          <div>
            <span className="eyebrow reveal">Mérida · Yucatán</span>
            <h1 className="reveal text-[clamp(46px,6.4vw,84px)] leading-[0.98] tracking-[-0.03em]" style={{ animationDelay: '.05s' }}>
              Trabajo<br />cerca de <span className="text-meyah-terracota-500">casa.</span>
            </h1>
            <p className="reveal mt-6 max-w-[460px] text-[clamp(16px,1.5vw,19px)] leading-[1.6] text-meyah-tinta-600" style={{ animationDelay: '.12s' }}>
              Encuentra empleo formal en Mérida sin perder horas en el tráfico. Vacantes cerca de tu colonia, publicadas por empresas yucatecas.
            </p>
            <div className="reveal mt-8 flex flex-wrap gap-3" style={{ animationDelay: '.18s' }}>
              <Button size="lg" asChild><Link to="/registro">Busco empleo <ArrowRight /></Link></Button>
              <Button variant="outline" size="lg" asChild><Link to="/registro">Quiero contratar</Link></Button>
            </div>
            <div className="reveal mt-[34px] flex items-center gap-3.5" style={{ animationDelay: '.24s' }}>
              <div className="flex">
                <span className="h-[34px] w-[34px] rounded-full border-[2.5px] border-meyah-crema-50 bg-meyah-jade-100" />
                <span className="-ml-2.5 h-[34px] w-[34px] rounded-full border-[2.5px] border-meyah-crema-50 bg-meyah-terracota-100" />
                <span className="-ml-2.5 h-[34px] w-[34px] rounded-full border-[2.5px] border-meyah-crema-50 bg-meyah-jade-500" />
                <span className="-ml-2.5 h-[34px] w-[34px] rounded-full border-[2.5px] border-meyah-crema-50 bg-meyah-crema-200" />
              </div>
              <p className="text-[13.5px] text-meyah-tinta-600">Empleo formal en Mérida, <b className="text-meyah-jade-900">cerca de tu colonia</b></p>
            </div>
          </div>

          <div className="reveal relative max-w-[460px] md:max-w-none" style={{ animationDelay: '.16s' }}>
            <div className="aspect-[4/3.5] overflow-hidden rounded-panel border border-meyah-border-soft shadow-lg">
              {/* showCard apagado: la tarjeta grande "Gerente de tienda" ya flota encima */}
              <BrandMap showCard={false} />
            </div>
            <div className="absolute -bottom-[26px] -left-[22px] w-[270px] rounded-card border border-meyah-border-soft bg-white px-5 py-[18px] shadow-lg max-[600px]:left-0 max-[600px]:w-[240px]">
              <span className="inline-flex items-center rounded-full bg-meyah-jade-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">Vacante cerca</span>
              <h3 className="mt-2.5 text-[19px] leading-[1.15]">Gerente de tienda</h3>
              <p className="mt-[9px] flex items-center gap-[5px] text-[13px] text-meyah-tinta-600"><MapPin size={14} className="text-meyah-jade-600" /> Altabrisa · 1.4 km</p>
              <p className="mt-3 text-[17px] font-bold text-meyah-jade-700">$18,000 – $25,000 <em className="text-[12px] font-medium not-italic text-meyah-tinta-400">/ mes</em></p>
              <div className="mt-3 border-t border-meyah-border-soft pt-3 text-[12.5px] text-meyah-tinta-400">Tortillería La Yucateca · Tiempo completo</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STAT ===== */}
      <section className="border-y border-meyah-border-soft bg-meyah-crema-100">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-7 py-16 md:[grid-template-columns:1.1fr_0.9fr] md:gap-14 md:py-[90px]">
          <div>
            <span className="eyebrow">El problema</span>
            <h2 className="mt-3 text-[clamp(30px,4vw,46px)]">Hecho para Mérida</h2>
            <p className="mt-[18px] max-w-[480px] text-[17px] leading-[1.7] text-meyah-tinta-600">El tráfico de Mérida no es como antes. Ir de Las Américas al norte puede tomar 45 minutos. Para una entrevista, una jornada laboral o un turno de fin de semana — la distancia importa.</p>
            <p className="mt-[18px] max-w-[480px] text-[17px] leading-[1.7] text-meyah-tinta-600">Meyah organiza las vacantes por <b className="text-meyah-jade-900">proximidad geográfica</b>. No te enseñamos todo lo que hay en la ciudad. Te enseñamos lo que está cerca de ti.</p>
          </div>
          <div className="text-center">
            <div className="relative inline-block font-display text-[clamp(120px,16vw,220px)] font-semibold leading-[0.8] tracking-[-0.04em] text-meyah-jade-700">45<span className="absolute -right-1 bottom-3.5 text-[0.18em] tracking-normal text-meyah-terracota-500">min</span></div>
            <div className="mt-6 text-[13px] font-semibold uppercase tracking-[0.06em] text-meyah-tinta-400">promedio perdido en tráfico, por trayecto</div>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section id="como" className="mx-auto max-w-[1200px] px-7 py-[100px]">
        <div className="mb-[54px] text-center">
          <span className="eyebrow">El proceso</span>
          <h2 className="mt-3 text-[clamp(30px,4vw,46px)]">Así de simple</h2>
        </div>
        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
          {[
            { n: '01', Icon: User, t: 'Crea tu cuenta', d: 'Regístrate como persona que busca trabajo o como empresa. Toma menos de un minuto, sin subir CV.' },
            { n: '02', Icon: MapPin, t: 'Define tu zona', d: 'Marca dónde vives o dónde está tu oficina. Meyah usa esa ubicación para mostrarte solo lo cercano.' },
            { n: '03', Icon: Route, t: 'Conecta cerca', d: 'Ves vacantes en tu área en un mapa. Los empleadores reciben a gente que ya vive cerca. Sin perder tiempo.' },
          ].map(({ n, Icon, t, d }) => (
            <div key={n} className="group rounded-panel border border-meyah-border-soft bg-meyah-crema-100 px-8 py-9 transition hover:-translate-y-1 hover:bg-white hover:shadow-md">
              <div className="font-display text-[56px] font-semibold leading-none tracking-[-0.02em] text-meyah-terracota-100 transition-colors group-hover:text-meyah-terracota-500">{n}</div>
              <div className="mt-5 mb-[18px] grid h-[50px] w-[50px] place-items-center rounded-[14px] bg-meyah-jade-50 text-meyah-jade-700"><Icon size={22} /></div>
              <h3 className="mb-2.5 text-[22px]">{t}</h3>
              <p className="text-[14.5px] leading-[1.6] text-meyah-tinta-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORÍAS ===== */}
      <section id="cats" className="mx-auto max-w-[1200px] px-7 pb-[100px]">
        <div className="mb-9 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Para todos los oficios</span>
            <h2 className="mt-3 text-[clamp(30px,4vw,46px)]">Empleo de verdad, cerca de ti</h2>
          </div>
          <Button variant="outline" asChild><Link to="/registro">Ver vacantes <ArrowRight /></Link></Button>
        </div>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
          {JOB_CATEGORIES.map((c) => {
            const Icon = ICON_BY_CATEGORY[c.value]
            return (
              <Link key={c.value} to="/registro" className="group flex flex-col gap-4 rounded-card border border-meyah-border-soft bg-white px-5 py-[22px] text-left transition hover:-translate-y-[3px] hover:border-meyah-border hover:shadow-md">
                <span className="grid h-12 w-12 place-items-center rounded-[13px] bg-meyah-jade-50 text-meyah-jade-700 transition group-hover:bg-meyah-jade-500 group-hover:text-white"><Icon size={24} /></span>
                <span className="text-[14.5px] font-semibold text-meyah-tinta-900">{c.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ===== PARA EMPRESAS ===== */}
      <section id="empresas" className="greca relative overflow-hidden bg-meyah-jade-900 text-white">
        <div className="relative z-[2] mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-9 px-7 py-[86px] md:[grid-template-columns:1.1fr_0.9fr] md:gap-[50px]">
          <div>
            <span className="eyebrow text-meyah-terracota-100">Para empresas</span>
            <h2 className="mt-3 mb-[18px] text-[clamp(30px,4vw,46px)] text-white">Contrata a gente<br />que vive cerca</h2>
            <p className="max-w-[440px] text-[17px] leading-[1.65] text-white/[0.78]">Publica tu vacante en el mapa y recibe postulaciones de personas de la zona. Menos rotación, menos retrasos, más compromiso.</p>
            <div className="mt-[30px]">
              <Button size="lg" asChild className="bg-meyah-terracota-500 text-white hover:bg-meyah-terracota-700"><Link to="/registro">Publicar una vacante <ArrowRight /></Link></Button>
              <div className="mt-7 flex gap-[30px] max-[600px]:flex-wrap max-[600px]:gap-5">
                {[['Gratis', 'para empezar'], ['2 min', 'publicar'], ['0 km', 'de distancia ideal']].map(([b, s]) => (
                  <div key={b}><b className="block font-display text-2xl text-white">{b}</b><span className="text-[12.5px] text-white/60">{s}</span></div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-panel border border-white/[0.16] bg-meyah-jade-700 p-[30px]">
            <div className="mb-[22px] grid h-[54px] w-[54px] place-items-center rounded-[15px] bg-white/[0.14] text-white"><Building2 size={20} /></div>
            <div className="mb-4 flex items-center">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-white text-meyah-jade-700"><Building2 size={13} /></span>
              <span className="mx-2.5 h-[3px] flex-1 rounded-full" style={{ background: 'repeating-linear-gradient(90deg,#fff 0 6px,transparent 6px 11px)' }} />
              <span className="h-[30px] w-[30px] shrink-0 rounded-full bg-meyah-terracota-500" />
            </div>
            <p className="text-[15px] leading-[1.6] text-white/85">Tu vacante en <b className="text-white">Altabrisa</b> llega a personas que ya viven en la zona.</p>
          </div>
        </div>
      </section>

      {/* ===== CIERRE ===== */}
      <section className="mx-auto max-w-[720px] px-7 py-[110px] text-center">
        <span className="eyebrow">Empieza hoy</span>
        <h2 className="mt-3 text-[clamp(34px,5vw,60px)]">Tu próximo empleo<br />está a la vuelta</h2>
        <p className="mx-auto mt-[18px] mb-[34px] max-w-[440px] text-[17px] leading-[1.6] text-meyah-tinta-600">Crear cuenta toma un minuto. No necesitas CV ni pruebas. Solo dinos quién eres y dónde estás.</p>
        <Button size="lg" asChild><Link to="/registro">Crear cuenta gratis <ArrowRight /></Link></Button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative bg-meyah-jade-900">
        <div className="greca h-2 opacity-50" />
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3.5 px-7 py-10">
          <div className="flex items-baseline gap-[3px] font-display text-[26px] font-semibold tracking-[-0.02em] text-white">Meyah<span className="h-1.5 w-1.5 self-center rounded-full bg-meyah-terracota-500" /></div>
          <p className="text-[13.5px] text-white/55">© 2026 Meyah · Hecho en Mérida, Yucatán</p>
        </div>
      </footer>
    </div>
  )
}
