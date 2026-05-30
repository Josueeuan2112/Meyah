import { Link } from 'react-router'
import { UserPlus, MapPin, Handshake } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import FadeInOnScroll from '@/shared/components/FadeInOnScroll'


function MayaPatternSmall() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="65" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="15" stroke="currentColor" strokeWidth="1.5" />
      <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="1.5" />
      <rect
        x="65"
        y="65"
        width="70"
        height="70"
        transform="rotate(45 100 100)"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

function MayaPatternLarge() {
  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="160" cy="160" r="145" stroke="currentColor" strokeWidth="2" />
      <circle cx="160" cy="160" r="110" stroke="currentColor" strokeWidth="2" />
      <circle cx="160" cy="160" r="75" stroke="currentColor" strokeWidth="2" />
      <circle cx="160" cy="160" r="40" stroke="currentColor" strokeWidth="2" />
      <circle cx="160" cy="160" r="12" stroke="currentColor" strokeWidth="2" />
      <line x1="160" y1="15" x2="160" y2="305" stroke="currentColor" strokeWidth="2" />
      <line x1="15" y1="160" x2="305" y2="160" stroke="currentColor" strokeWidth="2" />
      <rect
        x="107"
        y="107"
        width="106"
        height="106"
        transform="rotate(45 160 160)"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="130"
        y="130"
        width="60"
        height="60"
        transform="rotate(45 160 160)"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}

//hero

function HeroSection() {
  return (
    <section className="py-12 md:py-20 bg-meyah-crema-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col gap-10 md:grid md:grid-cols-12 md:gap-12 md:items-center">

          {/* Copy izquierdo */}
          <div className="md:col-span-7">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-meyah-terracota-700">
              MÉRIDA · 2026
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-meyah-jade-900 leading-[1.05] mt-4">
              Trabajo cerca de casa.
            </h1>

            <p className="text-lg md:text-xl text-meyah-tinta-600 mt-6 max-w-xl leading-relaxed">
              Encuentra empleo formal en Mérida sin perder horas en el tráfico. Vacantes
              cerca de tu colonia, publicadas por empresas yucatecas.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-meyah-jade-500 text-meyah-jade-700 hover:bg-meyah-jade-50 hover:text-meyah-jade-900 transition-all"
                asChild
              >
                <Link to="/registro">Busco empleo</Link>
              </Button>

              <Button
                size="lg"
                className="w-full sm:w-auto bg-meyah-jade-500 hover:bg-meyah-jade-700 text-white hover:scale-[1.02] transition-all"
                asChild
              >
                <Link to="/registro">Quiero contratar</Link>
              </Button>
            </div>
          </div>

          {/* Preview de vacante simulada */}
          <div className="md:col-span-5 relative mt-8 md:mt-0">
            {/* Patrón maya (solo desktop, detrás del card) */}
            <div className="hidden md:block absolute right-[-20px] top-[-20px] text-meyah-terracota-500 opacity-10 pointer-events-none">
              <MayaPatternSmall />
            </div>

            {/* Card de vacante */}
            <div className="relative z-10 bg-meyah-crema-100 border border-meyah-tinta-600/15 rounded-xl p-6 md:p-7 shadow-sm">
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-meyah-terracota-700 bg-meyah-terracota-50 px-2 py-1 rounded">
                VACANTE CERCA
              </span>

              <h3 className="font-display text-2xl text-meyah-jade-900 mt-4">
                Gerente de tienda
              </h3>

              <p className="text-sm text-meyah-tinta-600 mt-2 flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" />
                Altabrisa · 1.2 km
              </p>

              <p className="text-base font-semibold text-meyah-jade-700 mt-3">
                $18,000 – $25,000
              </p>

              <p className="text-xs text-meyah-tinta-600/70 mt-4 pt-3 border-t border-meyah-tinta-600/10">
                Tortillería La Yucateca · Tiempo completo
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

//¿Cómo funciona?

interface Step {
  numero: string
  titulo: string
  descripcion: string
  Icono: LucideIcon
}

const STEPS: Step[] = [
  {
    numero: '01',
    titulo: 'Crea tu cuenta',
    descripcion:
      'Regístrate como persona que busca trabajo o como empresa que quiere contratar. Toma menos de un minuto.',
    Icono: UserPlus,
  },
  {
    numero: '02',
    titulo: 'Define tu zona',
    descripcion:
      'Marca dónde vives o dónde está tu oficina. Meyah usa esa ubicación para mostrarte solo lo que está cerca.',
    Icono: MapPin,
  },
  {
    numero: '03',
    titulo: 'Conecta',
    descripcion:
      'Los candidatos ven vacantes en su área. Los empleadores reciben postulaciones de gente que ya vive cerca. Sin pérdida de tiempo.',
    Icono: Handshake,
  },
]

function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-meyah-crema-50">
      <div className="max-w-5xl mx-auto px-6">

        <FadeInOnScroll>
          <div className="text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-meyah-terracota-700">
              EL PROCESO
            </span>
            <h2 className="text-3xl md:text-5xl text-meyah-jade-900 mt-3">
              Así de simple
            </h2>
          </div>
        </FadeInOnScroll>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {STEPS.map(({ numero, titulo, descripcion, Icono }, index) => (
            <FadeInOnScroll key={numero} delay={0.05 * index}>
              <div className="bg-meyah-crema-100 border border-meyah-tinta-600/10 rounded-xl p-6 md:p-8 hover:translate-y-[-2px] hover:shadow-md transition-all duration-300">
                <span className="font-display text-5xl md:text-6xl text-meyah-terracota-500/40 leading-none">
                  {numero}
                </span>
                <Icono className="w-6 h-6 text-meyah-jade-700 mt-4" aria-hidden="true" />
                <h3 className="text-xl text-meyah-jade-900 mt-4">{titulo}</h3>
                <p className="text-meyah-tinta-600 mt-3 leading-relaxed">{descripcion}</p>
              </div>
            </FadeInOnScroll>
          ))}
        </div>

      </div>
    </section>
  )
}

//¿Por qué Meyah?

function WhyMeyahSection() {
  return (
    <section className="py-16 md:py-24 bg-meyah-crema-50">
      <FadeInOnScroll>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-8 md:grid md:grid-cols-12 md:gap-12 md:items-center">

            {/* Texto izquierdo */}
            <div className="md:col-span-7">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-meyah-terracota-700">
                EL PROBLEMA
              </span>
              <h2 className="text-3xl md:text-5xl text-meyah-tinta-900 mt-3">
                Hecho para Mérida
              </h2>
              <p className="text-lg text-meyah-tinta-900 mt-6 leading-relaxed">
                El tráfico de Mérida no es como antes. Ir de Las Américas al norte puede
                tomar 45 minutos. Para una entrevista, una jornada laboral, o un turno de
                fin de semana — la distancia importa.
              </p>
              <p className="text-lg text-meyah-tinta-900 mt-4 leading-relaxed">
                Meyah es la primera plataforma de empleo que organiza vacantes por
                proximidad geográfica. No te enseñamos lo que hay en toda la ciudad. Te
                enseñamos lo que está cerca de ti.
              </p>
            </div>

            {/* Cifra dramática derecha */}
            <div className="md:col-span-5 flex flex-col items-center justify-center mt-8 md:mt-0">
              <span className="font-display text-[180px] md:text-[220px] text-meyah-jade-700 leading-none font-semibold">
                45
              </span>
              <span className="text-2xl text-meyah-terracota-700 font-semibold mt-[-20px] ml-2">
                min
              </span>
              <span className="text-sm uppercase tracking-[0.15em] text-meyah-tinta-600 mt-6 text-center">
                promedio en tráfico
              </span>
            </div>

          </div>
        </div>
      </FadeInOnScroll>
    </section>
  )
}

// cta

function CtaSection() {
  return (
    <section className="py-16 md:py-24 bg-meyah-crema-50 relative overflow-hidden">
      {/* Patrón maya (solo desktop, esquina superior derecha) */}
      <div className="hidden md:block absolute top-0 right-0 text-meyah-crema-50 opacity-10 pointer-events-none">
        <MayaPatternLarge />
      </div>

      <FadeInOnScroll>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl text-meyah-tinta-900">
            Empieza hoy
          </h2>
          <p className="text-lg text-meyah-tinta-900 mt-6 max-w-xl mx-auto leading-relaxed">
            Crear cuenta toma un minuto. No tienes que subir CV ni hacer pruebas. Solo
            dinos quién eres y dónde estás.
          </p>
          <Button
            size="lg"
            className="mt-10 bg-meyah-terracota-500 hover:bg-meyah-terracota-700 text-white hover:scale-[1.02] transition-all duration-300"
            asChild
          >
            <Link to="/registro">Crear cuenta</Link>
          </Button>
        </div>
      </FadeInOnScroll>
    </section>
  )
}

// ===== COMPONENTE PRINCIPAL =====

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <WhyMeyahSection />
      <CtaSection />
    </>
  )
}
