# PorraBros

Plataforma multi-tenant de porras de deportes. Un usuario crea grupos, cada grupo elige un torneo (que mantiene el admin global), invita por enlace mágico, los miembros pronostican y el leaderboard del grupo se actualiza en directo.

UI, copy, comentarios y errores van en **español**.

> El repo todavía se llama `porra-mundial` por compatibilidad con la primera edición. La marca del producto es **PorraBros** (dominio `porrabros.com`). El Mundial 2026 es el primer torneo cargado pero la plataforma escala a más torneos.

## Stack

- **Next.js 14.2** (App Router) + **React 18** + **TypeScript strict**
- **Postgres** en **Neon** (driver `@neondatabase/serverless`, HTTP, sin pool)
- **Drizzle ORM** 0.36 — schema único en `lib/db/schema.ts`
- **Tailwind CSS** 3 con paleta custom (`pitch`, `grass`, `flame`, `chalk`)
- **jose** para JWT en cookie httpOnly · **Resend** para enviar magic links
- Despliegue: **Vercel** (free tier)

Path alias: `@/*` → raíz del repo.

## Comandos

Gestor de paquetes: **pnpm** (`pnpm-lock.yaml` es el único lockfile del repo).

```bash
pnpm dev          # Next dev en :3000
pnpm build        # Next build
pnpm lint         # next lint
pnpm db:push      # Drizzle Kit: aplicar schema directo a la DB (modo usado en este proyecto)
pnpm db:seed      # tsx scripts/seed.ts → crea torneo Mundial + 72 partidos + promociona ADMIN_EMAIL
pnpm sim          # tsx scripts/simulate.ts start → simulador 24h del torneo Mundial
pnpm sim:reset    # restaura kickoffs reales y borra resultados del torneo Mundial
```

> El proyecto usa `db:push` (no `migrate`). Ojo si cambias el schema en producción.

## Variables de entorno

Todas son **obligatorias** (la app revienta en arranque sin ellas):

- `DATABASE_URL` — connection string de Neon
- `JWT_SECRET` — mínimo 32 caracteres (validado en `lib/session.ts`)
- `APP_URL` — URL pública (e.g. `https://porrabros.com`); se usa para construir los enlaces del email
- `RESEND_API_KEY` — API key de Resend (https://resend.com/api-keys)
- `EMAIL_FROM` — remitente. Tipo `"PorraBros <noreply@porrabros.com>"`. El dominio debe estar verificado en Resend

Solo en seed (opcional):
- `ADMIN_EMAIL` — promociona a global admin al ejecutarlo

## Arquitectura

```
app/
  page.tsx                          → landing pública (redirige a /groups si hay sesión)
  login/                            → form de email + magic link
  groups/                           → SSR: lista mis grupos
  groups/new/                       → SSR: crear grupo (elige torneo)
  g/[slug]/                         → SSR: predicciones del grupo + LiveScoreboard
  g/[slug]/leaderboard/             → SSR auth-gate, datos vía /api/leaderboard
  g/[slug]/leaderboard/[userId]/    → SSR: pronósticos de otro miembro (sólo tras kickoff)
  g/[slug]/manage/                  → SSR: gestión owner (invite link + miembros + borrar grupo)
  join/[code]/                      → SSR: confirma unirse a grupo (redirige a /login si no logado)
  admin/                            → SSR auth-gate (isGlobalAdmin) + lista torneos
  admin/t/[slug]/                   → gestión de resultados de un torneo
  api/
    auth/request-link               → POST: crea magic link y lo envía
    auth/verify                     → GET ?token=…: consume token, crea sesión, redirige
    auth/logout                     → POST: limpia cookie
    groups                          → GET mis grupos · POST crear
    groups/[slug]                   → GET detalle (auth) · DELETE (owner)
    groups/[slug]/members           → GET miembros del grupo
    groups/[slug]/members/[userId]  → DELETE expulsar / salir
    join/[code]                     → GET preview · POST unirse
    predictions?groupSlug=…         → GET mis preds del grupo · POST upsert (rechaza si torneo iniciado)
    leaderboard?groupSlug=…         → GET ranking del grupo
    live?groupSlug=…                → GET partidos en directo del torneo
    admin/t/[slug]/result           → POST set/borra resultado (admin global)
components/
  NavBar, GroupTabs, NewGroupClient, ManageGroupClient, JoinClient
  PredictionsClient, LeaderboardClient, AdminResultsClient, LiveScoreboard
lib/
  db/index.ts                       → cliente Drizzle (Neon HTTP)
  db/schema.ts                      → users, tournaments, matches, groups,
                                       group_members, predictions, magic_links
  auth.ts                           → createMagicLink / consumeMagicLink
  email.ts                          → Resend SDK + plantilla del magic link
  group-access.ts                   → getGroupForMember (auth + tournamentId)
  matches-data.ts                   → 72 partidos del Mundial 2026 (sólo para seed)
  scoring.ts                        → calcPoints
  session.ts                        → JWT, payload con email + isGlobalAdmin
  slug.ts                           → slugify, randomInviteCode
  tournament.ts                     → getTournamentStart(tournamentId)
scripts/
  seed.ts                           → crea torneo Mundial + partidos + admin (idempotente)
  simulate.ts                       → simulador 24h de un torneo (default mundial-2026)
```

## Modelo de datos

- **users** — `email` único (índice), `name`, `isGlobalAdmin` (0/1, no boolean)
- **tournaments** — `slug` único, `name`, `sport`, `status` ('upcoming'|'live'|'finished')
- **matches** — pertenece a `tournament` (FK cascade), `matchNumber` único *por torneo*. `groupName`, `matchDate`, `matchTime`, `stadium`, banderas son **nullable** (para soportar deportes no-fútbol más adelante). `homeScore`/`awayScore` nullable (null = sin resultado)
- **groups** — `slug` único (`mi-grupo-ab12`), `inviteCode` único (6 chars sin caracteres confusos), `tournamentId` FK restrict (no se borra un torneo con grupos), `ownerId` FK restrict
- **group_members** — `(groupId, userId)` único compuesto, `role` ('owner'|'member')
- **predictions** — clave compuesta `(userId, matchId, groupId)`. Un user puede pronosticar el mismo match distinto en grupos distintos. FK con `onDelete: "cascade"` en todos los lados.
- **magic_links** — `token` único, `email`, `redirectTo` (ruta interna opcional), `expiresAt` (15 min), `consumedAt` nullable (uso una vez)

`isGlobalAdmin` se almacena como **integer 0/1**, no boolean. Comparar con `=== 1`.

## Reglas de la porra (scoring)

`lib/scoring.ts` es la fuente de verdad. Mismas que antes:

- **3 pts** → resultado exacto
- **1 pt** → mismo signo pero marcador distinto
- **0 pts** → fallo
- **pending** → si falta cualquier score

El leaderboard se calcula **por grupo**: lista miembros del grupo, suma puntos de sus predicciones de ese grupo. Ordena: total desc → exactos desc → nombre asc. Empate sólo si total **y** exactos coinciden. **El admin global no aparece** salvo que también sea miembro del grupo.

## Auth

- **Sin contraseñas.** El user pide acceso desde `/login` introduciendo su email.
- `POST /api/auth/request-link` crea un `magic_link` (token aleatorio base64url, expira en 15 min) y manda el email vía SMTP.
- El user pulsa el enlace → `GET /api/auth/verify?token=…` → consume token (idempotente), busca/crea user por email, firma JWT y mete cookie `porra_session` (`httpOnly`, `sameSite: lax`, `secure` en prod, 60 días).
- `redirectTo` viaja en el magic link para volver al destino original tras login (e.g. `/join/ABC123`).

`getSession()` se llama desde server components y route handlers. Page-level guards (`redirect("/login?next=…")`) van **siempre** en el server component, no en el client.

## Bloqueo de predicciones

Por torneo: con el primer kickoff del torneo se cierran las predicciones de todos los grupos que usan ese torneo. Se valida en servidor en `app/api/predictions/route.ts` comparando `new Date() >= getTournamentStart(tournamentId).iso`. El frontend también lo bloquea visualmente, pero esa es UX, no seguridad.

## Membresía y autorización

`lib/group-access.ts` expone `getGroupForMember(slug, userId)` que devuelve `null` si el user no es miembro. Todos los endpoints scoped por grupo lo usan como check único de auth + lookup de `tournamentId`.

## Zona horaria — CUIDADO

`lib/matches-data.ts` define los partidos del Mundial con hora **CEST (UTC+2 verano España)** y los convierte a UTC restando 2h en `iso()`. Todo el Mundial 2026 (junio) cae en horario de verano, así que está bien.

Si añades torneos con otras zonas: crea un helper análogo. La DB guarda **timestamp sin tz**; toda la app asume UTC ahí dentro.

## Patrones del proyecto

- **Server components** cargan datos con Drizzle directamente; serializan `Date` → `toISOString()` antes de pasar a client components.
- **Client components** marcados con `"use client"` solo donde hay estado.
- `PredictionsClient` guarda con **debounce 600ms** y muestra `guardando` / `✓ guardado` / error inline. Recibe `groupSlug` y lo manda en cada POST.
- `LeaderboardClient` hace **polling cada 30s** con `cache: "no-store"`. Recibe `groupSlug`.
- `LiveScoreboard` se monta dentro de las páginas `/g/[slug]/...`, no global.
- Los handlers de API devuelven siempre `{ ok: true }` o `{ error: "mensaje en español" }` con código HTTP correcto.
- Validación numérica de marcadores: enteros 0–20, en cliente y servidor.
- Borrar resultado: POST `/api/admin/t/[slug]/result` con `homeScore: null, awayScore: null`.

## Estilos

Paleta y componentes en `tailwind.config.ts` y utilidades CSS en `app/globals.css`:

- Colores: `pitch-*` (fondo oscuro), `grass-*` (verde), `flame-*` (naranja acento), `chalk-*` (texto), `paper-*`, `brick-*`
- Fonts vía Google Fonts en `globals.css`: **Bebas Neue** (display), **Manrope** (body), **JetBrains Mono** (mono)
- Clases reutilizables: `.btn-primary`, `.btn-secondary`, `.input-base`, `.score-input`, `.group-A`…`.group-L`
- Tema oscuro fijo (no hay light mode)

## Despliegue

Vercel + Neon + Resend. Tras el primer deploy, ejecutar `pnpm db:push && pnpm db:seed` desde local apuntando a la DB de Neon (mismo `DATABASE_URL`) para crear tablas y poblar el torneo Mundial + admin.

## Gotchas

- `next-env.d.ts` está en `.gitignore` — Next lo regenera.
- El `dynamic = "force-dynamic"` está en `/g/[slug]/leaderboard` y `/g/[slug]/leaderboard/[userId]`. Las demás páginas son dinámicas de facto porque leen cookies (`getSession`).
- `matches-data.ts` usa `Date.UTC(Y, M-1, D, h-2, m)`. Ese `-2` es la conversión CEST→UTC; no lo toques sin saber qué haces.
- Crear un grupo bloquea el flujo si no hay torneos cargados — el admin global tiene que crear/seedear al menos uno.
- `magic_links` tiene basura acumulada — `gcMagicLinks()` se llama oportunísticamente desde `request-link`. No hace falta cron.
- Owner del grupo NO puede salir vía DELETE — debe borrar el grupo entero.
