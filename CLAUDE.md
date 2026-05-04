# Porra Mundial 2026

App web para una porra del Mundial 2026 entre amigos: pronósticos por partido, clasificación en directo, panel de admin para introducir resultados. ~30 participantes esperados, 72 partidos (fase de grupos, 12 grupos A–L).

UI, copy, comentarios y mensajes de error van en **español**.

## Stack

- **Next.js 14.2** (App Router) + **React 18** + **TypeScript strict**
- **Postgres** en **Neon** (driver `@neondatabase/serverless`, HTTP, sin pool)
- **Drizzle ORM** 0.36 — schema único en `lib/db/schema.ts`, migraciones en `drizzle/`
- **Tailwind CSS** 3 con paleta custom (`pitch`, `grass`, `flame`, `chalk`)
- **jose** para JWT en cookie httpOnly · **bcryptjs** para hash de PINs
- Despliegue: **Vercel** (free tier)

Path alias: `@/*` → raíz del repo.

## Comandos

```bash
npm run dev          # Next dev en :3000
npm run build        # Next build
npm run lint         # next lint
npm run db:generate  # Drizzle Kit: generar migración nueva
npm run db:push      # Drizzle Kit: aplicar schema directo a la DB (modo usado en este proyecto)
npm run db:seed      # tsx scripts/seed.ts → carga los 72 partidos + crea admin si no existe
```

> El proyecto usa `db:push` (no `migrate`). Las migraciones de `drizzle/` están generadas pero el flujo real es `push`. Ojo si cambias el schema en producción.

## Variables de entorno

Las tres son **obligatorias** (la app revienta en arranque sin ellas):

- `DATABASE_URL` — connection string de Neon (`postgresql://...?sslmode=require`)
- `JWT_SECRET` — mínimo 32 caracteres (validado en `lib/session.ts`)
- `ADMIN_PASSWORD` — contraseña del usuario `admin`. Solo se usa en `scripts/seed.ts` al crear el admin la primera vez

## Arquitectura

```
app/
  page.tsx              → home (server, lee total partidos)
  login/                → login (client, POST /api/auth/login)
  predictions/          → SSR: carga partidos + mis predicciones, pasa a PredictionsClient
  leaderboard/          → SSR auth-gate, datos vienen de /api/leaderboard cliente
  admin/                → SSR auth-gate (isAdmin), lista partidos + participantes
  api/
    auth/login          → POST: bcrypt + crea JWT, set cookie
    auth/logout         → POST: limpia cookie
    matches             → GET: lista partidos (auth)
    predictions         → GET mis preds · POST upsert (rechaza si kickoff ≤ now)
    leaderboard         → GET: calcula ranking en memoria con calcPoints
    admin/result        → POST: admin set/borra resultado de partido
    admin/users         → GET lista · POST crear (genera PIN 4-dígitos si no se pasa)
    admin/users/[id]    → DELETE participante (cascade borra predicciones)
components/
  NavBar, PredictionsClient, LeaderboardClient, AdminClient
lib/
  db/index.ts           → cliente Drizzle (Neon HTTP)
  db/schema.ts          → users, matches, predictions
  matches-data.ts       → 72 partidos hard-coded con horarios CEST
  scoring.ts            → calcPoints(predH, predA, realH, realA)
  session.ts            → JWT (HS256, 60d), cookie `porra_session` httpOnly
scripts/seed.ts         → idempotente: insert MATCHES onConflictDoNothing + admin si !exists
```

## Modelo de datos

- **users** — `name` único (índice), `pinHash` (bcrypt), `isAdmin` (0/1, no boolean)
- **matches** — `matchNumber` único (1–72), `kickoffAt` timestamp UTC, `homeScore`/`awayScore` nullable (null = sin resultado)
- **predictions** — `(userId, matchId)` único compuesto, FK con `onDelete: "cascade"`

`isAdmin` se almacena como **integer 0/1**, no boolean. Comparar siempre con `=== 1`.

## Reglas de la porra (scoring)

`lib/scoring.ts` es la fuente de verdad:

- **3 pts** → resultado exacto
- **1 pt** → mismo signo (ganador o empate) pero marcador distinto
- **0 pts** → fallo
- **pending** → si falta cualquier score (predicción o real)

El leaderboard ordena por: total desc → exactos desc → nombre asc. Asigna posiciones compartidas en empate. **El admin no aparece en el leaderboard** (`u.isAdmin === 1` se filtra).

## Auth

Login único por **nombre + PIN**. Hashing con bcryptjs (cost 10). Sesión es JWT firmado con `JWT_SECRET` y guardado en cookie `porra_session` (`httpOnly`, `sameSite: lax`, `secure` en prod, 60 días).

`getSession()` se llama desde server components y route handlers. Los page-level guards (`redirect("/login")`, `redirect("/admin")`) van **siempre** en el server component, no en el client.

## Bloqueo de predicciones

El cierre se valida en **el servidor** comparando `new Date() >= matches.kickoffAt` en `app/api/predictions/route.ts`. El frontend también lo bloquea visualmente, pero esa es UX, no seguridad. Drift de reloj entre Neon/Vercel puede dar margen de pocos segundos.

## Zona horaria — CUIDADO

`lib/matches-data.ts` define los partidos con hora **CEST (UTC+2 verano España)** y los convierte a UTC restando 2h en `iso()`. Todo el Mundial 2026 (junio) cae en horario de verano, así que está bien para esta edición.

Si modificas horarios o pones partidos fuera de CEST: ajusta el helper. La DB guarda **timestamp sin tz**; toda la app asume UTC ahí dentro.

## Patrones del proyecto

- **Server components** cargan datos con Drizzle directamente; serializan `Date` → `toISOString()` antes de pasar a client components (evita errores de hydration).
- **Client components** marcados con `"use client"` solo donde hay estado (formularios, auto-refresh, debounce).
- `PredictionsClient` guarda con **debounce 600ms** y muestra estados `guardando` / `✓ guardado` / error inline.
- `LeaderboardClient` hace **polling cada 30s** con `cache: "no-store"`.
- Los handlers de API devuelven siempre `{ ok: true }` o `{ error: "mensaje en español" }` con código HTTP correcto.
- Validación numérica de marcadores: enteros 0–20, en cliente y servidor.
- Borrar resultado: POST `/api/admin/result` con `homeScore: null, awayScore: null`.
- Crear participante devuelve el PIN **una sola vez** en la respuesta — el admin debe copiarlo en ese momento.

## Estilos

Paleta y componentes en `tailwind.config.ts` y utilidades CSS en `app/globals.css`:

- Colores: `pitch-*` (fondo oscuro), `grass-*` (verde), `flame-*` (naranja acento), `chalk-*` (texto)
- Fonts vía Google Fonts en `globals.css`: **Bebas Neue** (display), **Manrope** (body), **JetBrains Mono** (mono)
- Clases reutilizables: `.btn-primary`, `.btn-secondary`, `.input-base`, `.score-input`, `.group-A`…`.group-L`
- Tema oscuro fijo (no hay light mode)

## Despliegue

Vercel + Neon. Las 3 env vars se ponen en el dashboard de Vercel. Tras el primer deploy, ejecutar `npm run db:push && npm run db:seed` desde local **apuntando a la DB de Neon** (mismo `DATABASE_URL`) para crear tablas y poblar partidos + admin.

## Gotchas

- `package.json` declara npm pero hay `pnpm-lock.yaml` también — usa el que prefieras pero **no commitees ambos lockfiles** modificados a la vez.
- `next-env.d.ts` está en `.gitignore` — Next lo regenera.
- Si reseteas `ADMIN_PASSWORD` después del seed: `db:seed` **NO** actualiza el admin existente. Borrar la fila a mano en Neon o cambiar el `pinHash` directo.
- El `dynamic = "force-dynamic"` solo está en `/leaderboard`. Las demás páginas son dinámicas de facto porque leen cookies (`getSession`).
- `matches-data.ts` usa `Date.UTC(Y, M-1, D, h-2, m)`. Ese `-2` es la conversión CEST→UTC; no lo toques sin saber qué haces.
