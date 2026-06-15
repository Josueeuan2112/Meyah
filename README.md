# Meyah

**Encuentra trabajo cerca de tu casa.** Marketplace de empleos formales con búsqueda por cercanía geográfica para Mérida, Yucatán.

> Para el contexto completo del proyecto (identidad, convenciones, arquitectura, reglas de seguridad y flujo de migraciones) ver [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **Frontend:** React 19 + Vite 8 + TypeScript 6, Tailwind CSS v4, shadcn/ui, React Router v7, TanStack Query v5, React Hook Form + Zod.
- **Backend:** Supabase (Auth + PostgreSQL + Storage + RLS) con PostGIS.
- **Mapas:** Leaflet + React-Leaflet, tiles de CartoDB, geocoding con Nominatim (OpenStreetMap).
- **Infra:** Vercel (frontend), Cloudflare (DNS/WAF), Sentry (monitoreo opcional).

## Requisitos

- Node.js 22+
- Cuenta de Supabase (proyecto enlazado con la CLI de Supabase)

## Variables de entorno

Copia [`.env.example`](./.env.example) a `.env.local` y rellena los valores. **Nunca** commitees `.env.local`.

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sí | Anon/public key (segura en el frontend) |
| `VITE_SENTRY_DSN` | No | Si se define, activa el reporte de errores en producción |

En Vercel, configurar estas variables en **Settings → Environment Variables** (las `VITE_*` se incrustan en build).

## Comandos

```bash
npm run dev        # Servidor de desarrollo (Vite)
npm run build      # tsc -b && vite build (producción)
npm run preview    # Previsualizar el build
npm run lint       # ESLint
npm run gen:types  # Regenerar tipos de Supabase desde la BD enlazada
```

**Type-check oficial:** `npx tsc --noEmit -p tsconfig.app.json`
(NO usar `npx tsc --noEmit` a secas: el tsconfig raíz es solution-style y reporta cero archivos.)

## Base de datos / migraciones

Toda alteración del esquema va en un archivo versionado en `supabase/migrations/`:

```bash
npx supabase db push --linked        # aplica las migraciones pendientes al remoto
npx supabase migration list --linked # verifica sincronía Local = Remote
npm run gen:types                    # regenera src/shared/types/database.types.ts
```

**Nunca** usar el SQL Editor del dashboard para cambios de esquema (desincroniza el remoto de los archivos versionados).

## Despliegue (Vercel)

1. Configurar las variables de entorno (arriba).
2. `vercel.json` ya define el fallback SPA y las cabeceras de seguridad (CSP, HSTS, etc.).
3. **Antes de lanzar:** reemplazar `REEMPLAZAR-DOMINIO.com` en `public/robots.txt` y `public/sitemap.xml` por el dominio real.

### Checklist de configuración externa pendiente (no vive en el repo)

- [ ] Supabase Auth: `site_url` y Redirect URLs de producción (hoy en localhost).
- [ ] Supabase Auth: SMTP propio (el integrado limita a 2 correos/hora) y **Leaked password protection ON**.
- [ ] Cloudflare: proxy + SSL Full (strict) + WAF/rate-limit en `/rest/v1/rpc/*` y `/auth/*`.
- [ ] Plan de Supabase con backups/PITR confirmados para datos reales.

## Estructura

Ver [`CLAUDE.md`](./CLAUDE.md) → "Estructura de archivos". Resumen: `src/features/<dominio>/{components,hooks,pages,schemas}` + `src/shared/{components,ui,hooks,lib,types}` + `src/app/{providers,router}`.
