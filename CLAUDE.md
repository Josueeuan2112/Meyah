# CLAUDE.md — Contexto del proyecto Meyah

## 🎯 Identidad del proyecto

**Nombre:** Meyah (de "Meyaj", que significa "trabajo" en maya yucateco)

**Qué es:** Marketplace de empleos formales con búsqueda por cercanía geográfica.

**Para quién:** Empleadores y candidatos en Mérida, Yucatán, México.

**Propuesta de valor:** "Encuentra trabajo cerca de tu casa." Combatir el problema del tráfico y la distancia eligiendo empleos por proximidad geográfica.

**Nicho del MVP:** empleos formales de tiempo completo (oficina, retail, gerencias). NO incluye trabajos por hora, servicios por proyecto, ni informales.

**Estado:** MVP en construcción. Sin usuarios reales aún.

## 🛠️ Stack tecnológico

### Frontend

- **React 19** + **Vite 8** + **TypeScript 6**
- **Tailwind CSS v4** (con `@theme` en CSS, NO `tailwind.config.js`)
- **shadcn/ui** (componentes copiados a `src/shared/ui/`)
- **React Router v7** (paquete `react-router`, NO `react-router-dom`)
- **TanStack Query v5**
- **React Hook Form v7** + **Zod v4** + **@hookform/resolvers**

### Backend

- **Supabase** (Auth + PostgreSQL + Storage + Row Level Security)
- **PostGIS** (extensión de PostgreSQL para queries geográficas)

### Mapas

- **Leaflet** + **React-Leaflet** + **OpenStreetMap** (gratis, sin tarjeta de crédito)

### Infraestructura

- **GitHub** (control de versiones)
- **Vercel** (despliegue del frontend)
- **Cloudflare** (DNS + WAF + protección DDoS)
- **Sentry** (monitoreo de errores, opcional)

## 📁 Estructura de archivos

```
src/
├── app/                  # Configuración global de la app
│   ├── providers.tsx     # TanStack Query, otros providers
│   └── router.tsx        # Configuración de React Router
│
├── features/             # Lógica de negocio organizada por dominio
│   ├── auth/             # Login, registro, sesión
│   ├── jobs/             # Vacantes (CRUD, mapa, búsqueda)
│   ├── companies/        # Empresas (registro, edición)
│   └── applications/     # Postulaciones (crear, ver, gestionar)
│
├── shared/               # Reutilizable entre features
│   ├── components/       # Componentes generales (Header, Footer, Layout)
│   ├── ui/               # Componentes de shadcn/ui
│   ├── hooks/            # Hooks generales
│   ├── lib/              # Utilidades (cliente Supabase, helpers, utils.ts)
│   └── types/            # Tipos TypeScript globales
│
├── styles/
│   └── globals.css       # Tailwind + design tokens Meyah
│
└── main.tsx              # Punto de entrada
```

**Cada feature interna sigue la misma estructura:**

```
features/<nombre>/
├── components/   # componentes específicos de la feature
├── hooks/        # hooks específicos
├── pages/        # páginas (montadas en el router)
└── schemas/      # validaciones Zod
```

## 🎨 Identidad visual

**Vibe:** Cálido yucateco, terroso, moderno. NO glassmorphism. NO tema oscuro corporativo.

**Paleta (definida como design tokens en `src/styles/globals.css`):**

- `meyah-jade-50/500/700/900` — Verde jade maya (color principal de marca)
- `meyah-terracota-50/500/700` — Terracota tierra yucateca (acentos)
- `meyah-crema-50/100` — Crema cálido (fondos)
- `meyah-tinta-600/900` — Marrón oscuro (textos)

**Mapeo a tokens semánticos de shadcn (en `globals.css`):**

- `primary` → meyah-jade
- `background` → meyah-crema
- `accent` → meyah-terracota
- `foreground` → meyah-tinta

**Tipografía** (auto-hospedada vía `@fontsource`, sin Google CDN):

- `font-display` → **Fraunces** (títulos h1–h6) — pesos 400, 500, 600, 700
- `font-sans` → **Inter** (cuerpo, default de body) — pesos 400, 500
- Los `<h1>`–`<h6>` toman Fraunces por default vía CSS base en `globals.css`.
- Utility classes de Tailwind: `font-display` y `font-sans`.

## ⚙️ Convenciones de código

### Idioma

- **Código (variables, funciones, archivos):** inglés
- **CLAUDE.md y comentarios largos:** español
- **Commits:** Conventional Commits en inglés (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `style:`, `test:`)

### TypeScript

- **Strict mode habilitado.** Nada de `any` salvo en casos excepcionales con comentario justificando.
- Tipos de Supabase generados automáticamente desde la BD (a configurar en Etapa 2).
- Schemas de Zod definen también los tipos: `type LoginForm = z.infer<typeof loginSchema>`.

### Imports

- **Siempre usar el alias `@/`** que apunta a `src/`.
- Orden de imports: librerías externas → alias `@/` → relativos `./`.

### Componentes React

- **Functional components con TypeScript.** Nada de clases.
- Un componente por archivo. Nombre del archivo = nombre del componente (PascalCase para componentes, kebab-case para utilidades).
- Props tipadas con interface o type, exportadas si son útiles fuera.
- Hooks personalizados van en `hooks/` con prefijo `use` (ej. `useAuth`, `useNearbyJobs`).

### Estilos

- **Tailwind first.** Nada de CSS modules ni styled-components.
- Cuando hay variantes complejas → usar `cva` (ya viene con shadcn).
- Combinar clases con `cn()` de `@/shared/lib/utils`.

### Responsive (mobile-first)

- Diseño SIEMPRE mobile-first: las clases base de Tailwind aplican a móvil; los prefijos `sm:`, `md:`, `lg:` AGREGAN estilos para pantallas más grandes.
- Toda página y componente debe verse correctamente en móvil (320–414px de ancho) antes de considerarse terminado.
- Verificar SIEMPRE en DevTools (modo responsive) antes de declarar un componente listo.
- Breakpoints estándar de Tailwind: `sm=640px`, `md=768px`, `lg=1024px`, `xl=1280px`.
- Prioridad de uso real de Meyah: ~75% móvil, ~25% desktop. El móvil NO es secundario.

### Datos + iteración vs JSX repetido

- Si hay 3+ elementos similares (misma estructura, distinta data) → preferir array de datos + `.map()` para iterar.
- Si los elementos tienen estructuras o propósitos distintos → mantener JSX separado, NO forzar iteración.
- Si hay solo 2 elementos similares → criterio: iterar si la lógica lo amerita, mantener separado si la legibilidad gana.
- Regla mental: la diferencia es solo data → itera. La diferencia es estructura → no fuerces.
- Ejemplos: lista de pasos/cards/items repetitivos = iterar. Hero único, Header, Footer, formularios complejos = NO iterar.
- NUNCA aplicar iteración para "verse limpio" si el resultado es más difícil de leer.

### Estado y datos

- **Estado local:** `useState` o `useReducer`.
- **Estado del servidor:** TanStack Query, NO `useState` + `useEffect`.
- **Estado global compartido:** Context API si es indispensable. Evitar Redux/Zustand en MVP.

### Formularios

- **SIEMPRE** React Hook Form + Zod.
- Schema de validación en `features/<nombre>/schemas/`.

## 🔒 Reglas no negociables de seguridad

1. **Nunca `console.log` de datos sensibles** (passwords, tokens, emails de usuarios).
2. **Variables de entorno separadas:**
   - `VITE_*` → frontend (públicas, anon key OK aquí)
   - Sin prefijo → solo backend (service role key, secrets)
3. **`.env.local` SIEMPRE en `.gitignore`.** Nunca commits con secretos.
4. **Validación de input siempre con Zod** antes de mandar al backend.
5. **Row Level Security activado** en todas las tablas de Supabase.
6. **No hashes ni encriptes contraseñas a mano.** Lo hace Supabase Auth.

## 📐 Decisiones de arquitectura

### Lo que SÍ está en el MVP

- Registro/login (empleadores y candidatos) con verificación de email
- Empleadores: registrar empresa, publicar vacantes con ubicación geográfica
- Candidatos: ver mapa con vacantes cerca, postularse
- Empleadores: ver postulaciones recibidas

### Lo que NO está en el MVP (postergado intencionalmente)

- Chat / mensajería interna
- Subir CV en PDF
- Sistema de calificaciones / reseñas
- Notificaciones push
- Multi-idioma
- Pagos / monetización (vacantes destacadas se preparan en BD pero no se activan)

### Campos future-proof en la BD

Algunas tablas tienen campos como `is_featured`, `views_count`, `is_verified`, `expires_at` que no se usan en MVP pero están listos para v2/v3 sin migrar datos.

## 🤖 Cómo trabajar con Claude Code en este proyecto

### Reglas para Claude Code

1. **NUNCA generar código que use librerías no listadas arriba sin avisar primero.**
2. **Antes de instalar dependencias nuevas, justificar por qué se necesitan.**
3. **Respetar la estructura de carpetas por feature.** Nada de poner componentes random en cualquier lado.
4. **Imports siempre con `@/`.** Nada de `../../../`.
5. **Si una decisión técnica no es trivial, explicarla antes de implementarla.** Mejor preguntar que nada.
6. **No tocar configuración existente** (`tsconfig`, `vite.config`, `components.json`, `globals.css`) sin justificación.
7. **Usar TypeScript estricto.** Sin `any` sin comentario.
8. **No agregar features fuera del scope del MVP** (ver lista arriba).
9. **No incluir línea Co-Authored-By ni atribución de Claude en los mensajes de commit.**

### Estilo de respuestas preferido

- Conciso, sin relleno.
- Si haces algo que no pedí, marcarlo explícitamente como "agregué X porque Y".
- Mostrar siempre el contenido final de archivos modificados, no solo diffs.

## Verificación de tipos

- Comando oficial: `npx tsc --noEmit -p tsconfig.app.json`
- NO usar `npx tsc --noEmit` a secas: el `tsconfig.json` raíz es solution-style (`files: []` + `references`), y `tsc` sin `--build` no sigue las referencias, así que revisa CERO archivos y siempre reporta limpio (falso negativo).
- `baseUrl` fue eliminado de `tsconfig.app.json` (deprecado en TS 6, se elimina en TS 7). El alias `@/*` resuelve por `paths` relativo (`./src/*`) gracias a `moduleResolution: "bundler"`, sin `baseUrl`.

## 📊 Roadmap general

- **v1 (MVP):** lo descrito en este documento. 6-12 semanas estimadas.
- **v2:** chat, subida de CV, perfiles más ricos.
- **v3:** monetización (vacantes destacadas), verificación de empresas.
- **v4+:** expansión a otras ciudades de Yucatán, suscripciones empleadores.

**REGLA CRÍTICA:** Hasta no terminar y desplegar v1 completa en producción, NO se trabaja en features de v2 o posteriores. Esta regla NO admite excepciones, ni siquiera "una cosita chiquita". Si surge una idea brillante para v2, se anota como issue en GitHub y se pospone. Disciplina sobre entusiasmo.
