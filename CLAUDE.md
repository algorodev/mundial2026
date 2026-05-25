# PorraBros

Plataforma multi-tenant de porras de deportes. Un usuario crea grupos, cada grupo elige un torneo (que mantiene el admin global), invita por enlace, los miembros pronostican y el leaderboard del grupo se actualiza en directo.

UI, copy, comentarios y errores van en **español**.

> El repo todavía se llama `porra-mundial` por compatibilidad con la primera edición. La marca del producto es **PorraBros** (dominio `porrabros.com`). El Mundial 2026 es el primer torneo cargado pero la plataforma escala a más torneos.

## Stack

- **Next.js 14.2** (App Router) + **React 18** + **TypeScript strict**
- **Postgres** en **Neon** (driver `@neondatabase/serverless`, HTTP, sin pool)
- **Drizzle ORM** 0.36 — schema único en `lib/db/schema.ts`
- **Tailwind CSS** 3 con paleta custom (`pitch`, `grass`, `flame`, `chalk`)
- **bcryptjs** para hash de contraseñas · **jose** para JWT en cookie httpOnly · **Resend** para emails de set/reset password
- Despliegue: **Vercel** (free tier)

Path alias: `@/*` → raíz del repo.

## Comandos

Gestor de paquetes: **pnpm** (`pnpm-lock.yaml` es el único lockfile del repo).

```bash
pnpm dev          # Next dev en :3000
pnpm build        # Next build
pnpm lint         # next lint
pnpm db:push      # Drizzle Kit: aplicar schema directo a la DB (modo usado en este proyecto)
pnpm db:seed      # tsx scripts/seed.ts → crea torneos + partidos + equipos + promociona ADMIN_EMAIL
pnpm db:map-api   # tsx scripts/map-api-ids.ts → rellena apiTeamId/apiFixtureId desde API-Football
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

Opcionales en runtime:
- `NEXT_PUBLIC_GA4_ID` — GA4 Measurement ID (`G-XXXXXXXXXX`). Si está, `components/GoogleAnalytics.tsx` carga gtag.js. Si no, no se carga.
- `API_FOOTBALL_KEY` — API key de [api-sports.io](https://www.api-football.com/) (plan Pro). Requerida para `pnpm db:map-api`, el cron `/api/cron/results` y los endpoints de enriquecimiento. Sin ella, la app sigue funcionando con resultados manuales.
- `CRON_SECRET` — token aleatorio (e.g. `openssl rand -hex 32`). Lo usa el workflow `.github/workflows/cron-results.yml` para autenticarse contra `/api/cron/results` (header `Authorization: Bearer …`). **Sin él, el endpoint del cron rechaza todo (401)** — esto es deliberado para evitar abusos. Debe existir tanto en Vercel (env var) como en GitHub (repo secret).

## Arquitectura

```
app/
  page.tsx                          → landing pública (redirige a /groups si hay sesión)
  login/                            → form email + password
  register/                         → alta de cuenta (nombre + email + password)
  forgot-password/                  → pide enlace de reset
  auth/set-password/                → form para fijar password con token (no consume hasta POST)
  groups/                           → SSR: lista mis grupos
  groups/new/                       → SSR: crear grupo (elige torneo)
  g/[slug]/                         → SSR: predicciones del grupo + LiveScoreboard
  g/[slug]/leaderboard/             → SSR auth-gate, datos vía /api/leaderboard
  g/[slug]/leaderboard/[userId]/    → SSR: pronósticos de otro miembro (sólo tras kickoff)
  g/[slug]/standings/               → SSR auth-gate, datos vía /api/tournaments/[slug]/standings
  g/[slug]/m/[matchNumber]/         → SSR: detalle de partido (lineups + eventos + H2H)
  g/[slug]/manage/                  → SSR: gestión owner (invite link + miembros + borrar grupo)
  join/[code]/                      → SSR: confirma unirse a grupo (redirige a /login si no logado)
  admin/                            → SSR auth-gate (isGlobalAdmin) + lista torneos
  admin/t/[slug]/                   → gestión de resultados de un torneo
  api/
    auth/login                      → POST email+password (cuenta sin pass aún → manda link "set")
    auth/register                   → POST nombre+email+password → crea user y sesión
    auth/forgot-password            → POST email → manda enlace de reset (silencioso si no existe)
    auth/set-password               → POST token+password → consume token, hashea y firma sesión
    auth/logout                     → POST: limpia cookie
    groups                          → GET mis grupos · POST crear
    groups/[slug]                   → GET detalle (auth) · DELETE (owner)
    groups/[slug]/members           → GET miembros del grupo
    groups/[slug]/members/[userId]  → DELETE expulsar / salir
    join/[code]                     → GET preview · POST unirse
    predictions?groupSlug=…         → GET mis preds del grupo · POST upsert (rechaza si torneo iniciado)
    leaderboard?groupSlug=…         → GET ranking del grupo
    live?groupSlug=…                → GET partidos en directo del torneo
    admin/t/[slug]/result           → POST set/borra resultado (admin global) — marca resultSource='admin'
    cron/results                    → GET (auth Bearer CRON_SECRET) — actualiza scores FT desde API-Football
    match/[matchId]/lineups         → GET alineaciones (cache adaptado al estado del partido)
    match/[matchId]/events          → GET eventos (goles, tarjetas, cambios)
    match/[matchId]/h2h             → GET últimos 10 enfrentamientos entre los dos equipos
    tournaments/[slug]/standings    → GET clasificación de grupos / liga
components/
  NavBar, GroupTabs, NewGroupClient, ManageGroupClient, JoinClient
  PredictionsClient, LeaderboardClient, AdminResultsClient
  LiveScoreboard (con goleadores tirando de /api/match/[id]/events)
  MatchDetailClient (lineups + eventos + H2H)
  TournamentStandings (tabla de grupos / liga)
lib/
  db/index.ts                       → cliente Drizzle (Neon HTTP)
  db/schema.ts                      → users (con passwordHash nullable), tournaments (con apiLeagueId/Season),
                                       matches (con apiFixtureId/resultSource), teams, groups,
                                       group_members, predictions, magic_links
  auth.ts                           → createMagicLink / peekMagicLink / consumeMagicLink
  password.ts                       → bcryptjs: hashPassword, verifyPassword, validatePassword (min 8)
  email.ts                          → Resend SDK + plantilla "crea/restablece tu contraseña"
  group-access.ts                   → getGroupForMember (auth + tournamentId)
  matches-data.ts                   → 72 partidos del Mundial 2026 (sólo para seed)
  api-football.ts                   → cliente HTTP de api-sports.io v3 (key, fetch, tipado)
  scoring.ts                        → calcPoints
  session.ts                        → JWT, payload con email + isGlobalAdmin
  slug.ts                           → slugify, randomInviteCode
  tournament.ts                     → getTournamentStart(tournamentId)
scripts/
  seed.ts                           → crea torneos + partidos + equipos + admin (idempotente)
  map-api-ids.ts                    → rellena apiTeamId/apiFixtureId desde API-Football (idempotente)
  simulate.ts                       → simulador 24h de un torneo (default mundial-2026)
```

## Modelo de datos

- **users** — `email` único (índice), `name`, `passwordHash` (text nullable, bcrypt), `isGlobalAdmin` (0/1, no boolean). passwordHash null = cuenta "transicional" sin password fijada todavía
- **tournaments** — `slug` único, `name`, `sport`, `status` ('upcoming'|'live'|'finished'). `apiLeagueId`/`apiSeason` nullable: si están, el torneo participa en `pnpm db:map-api` y en los crons de auto-resultados.
- **matches** — pertenece a `tournament` (FK cascade), `matchNumber` único *por torneo*. `groupName`, `matchDate`, `matchTime`, `stadium`, banderas son **nullable** (para soportar deportes no-fútbol más adelante). `homeScore`/`awayScore` nullable (null = sin resultado). `apiFixtureId` único global nullable (poblado por el script de mapeo). `resultSource` ('api'|'admin'|null) indica quién escribió el último resultado — el cron NUNCA pisa 'admin'.
- **teams** — equipos por torneo, `(tournamentId, code)` único compuesto. `code` enlaza con `matches.homeCode/awayCode`. `apiTeamId`/`logoUrl` los rellena `pnpm db:map-api`.
- **groups** — `slug` único (`mi-grupo-ab12`), `inviteCode` único (6 chars sin caracteres confusos), `tournamentId` FK restrict (no se borra un torneo con grupos), `ownerId` FK restrict
- **group_members** — `(groupId, userId)` único compuesto, `role` ('owner'|'member')
- **predictions** — clave compuesta `(userId, matchId, groupId)`. Un user puede pronosticar el mismo match distinto en grupos distintos. FK con `onDelete: "cascade"` en todos los lados.
- **magic_links** — `token` único, `email`, `redirectTo` (ruta interna opcional), `expiresAt` (15 min), `consumedAt` nullable (uso una vez). Hoy se usan **solo** para crear/resetear password (no para login directo)

`isGlobalAdmin` se almacena como **integer 0/1**, no boolean. Comparar con `=== 1`.

## Reglas de la porra (scoring)

`lib/scoring.ts` es la fuente de verdad. Mismas que antes:

- **3 pts** → resultado exacto
- **1 pt** → mismo signo pero marcador distinto
- **0 pts** → fallo
- **pending** → si falta cualquier score

El leaderboard se calcula **por grupo**: lista miembros del grupo, suma puntos de sus predicciones de ese grupo. Ordena: total desc → exactos desc → nombre asc. Empate sólo si total **y** exactos coinciden. **El admin global no aparece** salvo que también sea miembro del grupo.

## Auth

- **Email + contraseña** (bcryptjs, salt rounds 10, min 8 chars). El JWT se firma con `jose` y va en cookie `porra_session` (`httpOnly`, `sameSite: lax`, `secure` en prod, 60 días).
- **Login** (`POST /api/auth/login`): valida bcrypt, firma sesión. Si el email existe **sin** `passwordHash` (cuenta transicional creada por seed/admin-link/era magic-link), el endpoint manda automáticamente un enlace "crea tu contraseña" y responde `{ ok: true, sentLink: true }` — el frontend muestra panel "revisa tu correo".
- **Registro** (`POST /api/auth/register`): nombre + email + password. Si el email ya existe (con o sin password) responde 409 con CTA a iniciar sesión.
- **Olvido / reset** (`POST /api/auth/forgot-password`): manda enlace si el user existe. Respuesta siempre genérica `{ ok: true }` para no enumerar cuentas.
- **Magic link → set-password**: el email lleva a `/auth/set-password?token=…` (página intermedia que **no consume** el token; previene prefetchers de email). El form dispara `POST /api/auth/set-password` que consume token, hashea password, firma sesión y devuelve `redirectTo`.
- `redirectTo` viaja en el magic link y en `?next=` de las pantallas de login/register/forgot, para volver al destino original (e.g. `/join/ABC123`).

`getSession()` se llama desde server components y route handlers. Page-level guards (`redirect("/login?next=…")`) van **siempre** en el server component, no en el client.

## Bloqueo de predicciones

Por torneo: con el primer kickoff del torneo se cierran las predicciones de todos los grupos que usan ese torneo. Se valida en servidor en `app/api/predictions/route.ts` comparando `new Date() >= getTournamentStart(tournamentId).iso`. El frontend también lo bloquea visualmente, pero esa es UX, no seguridad.

## Membresía y autorización

`lib/group-access.ts` expone `getGroupForMember(slug, userId)` que devuelve `null` si el user no es miembro. Todos los endpoints scoped por grupo lo usan como check único de auth + lookup de `tournamentId`.

## Integración con API-Football

Cliente HTTP en `lib/api-football.ts` (api-sports.io v3). Requiere `API_FOOTBALL_KEY`. Lanza `Error` si la API responde con `errors` (rate limit, parámetros inválidos, etc.).

Cada torneo guarda su `apiLeagueId` + `apiSeason` (fijados en `scripts/seed.ts`). IDs típicos: World Cup = 1, UEFA Champions League = 2, LaLiga = 140. La season es el año de inicio (2025-26 → season=2025).

Flujo de mapeo (`pnpm db:map-api`, idempotente, puede filtrarse por `pnpm db:map-api <slug>`):
1. `/teams?league=L&season=S` → casa por `team.code` (case-insensitive) contra `teams.code`. Rellena `apiTeamId` + `logoUrl`. Reporta huecos en consola.
2. `/fixtures?league=L&season=S` → indexa por `(apiHomeTeamId, apiAwayTeamId, día UTC)` y casa con nuestros matches usando `homeCode/awayCode`. Tolera ±1 día por desfase de zona horaria.

Si los códigos de la API no coinciden con los nuestros (típico en clubes y, sorprendentemente, en muchas selecciones del Mundial — la API usa `SPA` en vez de `ESP`, `SAU` en vez de `KSA`, `IRA` para Irán e Irak, etc.), añade overrides manuales en `TEAM_OVERRIDES` dentro de `scripts/map-api-ids.ts`: `{ "<slug-torneo>": { OUR_CODE: apiTeamId } }`. Cuando faltan equipos por casar, el script imprime los candidatos libres de la API para que puedas construir el override sin adivinar.

### Cron de auto-resultados

**Scheduler: GitHub Actions, no Vercel.** Vercel Hobby sólo permite crons diarios, así que el workflow `.github/workflows/cron-results.yml` pingea `GET /api/cron/results` cada 10 minutos (con `workflow_dispatch` para test manual). Requiere dos repo secrets: `APP_URL` (URL pública sin barra final) y `CRON_SECRET`. El endpoint rechaza cualquier llamada sin `Authorization: Bearer ${CRON_SECRET}`.

Flujo (`app/api/cron/results/route.ts`):
- Filtra torneos con `apiLeagueId/apiSeason` y `status in ('live','upcoming')`.
- Pide `/fixtures?league=L&season=S&from=ayer&to=hoy` (UTC).
- Por cada fixture cuyo `apiFixtureId` coincida con un match nuestro:
  - Si `resultSource = 'admin'` → **skip** (override manual gana siempre).
  - Si el status no es FT/AET/PEN → skip (no escribimos parciales).
  - Si el score coincide con lo que ya hay → skip (no spameamos updates).
  - Si no, escribe `homeScore/awayScore` y marca `resultSource='api'`.
- Devuelve un resumen JSON `{ ok, window, summary: [{ slug, fetched, updated, skippedAdmin, skippedNotFinal }] }` útil para debugging desde la consola de Vercel.

El endpoint admin `/api/admin/t/[slug]/result` marca `resultSource='admin'` al guardar y `null` al borrar (para que el cron pueda volver a rellenar si quiere).

### Endpoints de enriquecimiento (Fase 2)

Todos requieren sesión (`getSession()`) y devuelven `{ ok: true, ... }` o `{ error }`. El cache de Next se comparte entre todos los usuarios, así que sólo gastamos cuota de API una vez por ventana de revalidate aunque pidan 1000 personas:

- `GET /api/match/[matchId]/lineups` — usa `apiFixtureId`. TTL via `matchCacheTtl` con `liveTtl: 300` (lineups no cambian salvo por sustituciones).
- `GET /api/match/[matchId]/events` — usa `apiFixtureId`. TTL via `matchCacheTtl` (30s en directo).
- `GET /api/match/[matchId]/h2h` — usa `teams.apiTeamId` (home + away). Cache 24h. Devuelve los últimos 10 enfrentamientos.
- `GET /api/tournaments/[slug]/standings` — usa `apiLeagueId/apiSeason`. TTL 5 min si torneo `live`, 24h si no.

Si un partido no tiene `apiFixtureId` o sus equipos no tienen `apiTeamId`, los endpoints devuelven 422 con mensaje explícito (corre `pnpm db:map-api` para completar el mapeo).

`lib/api-football.ts::matchCacheTtl(kickoffAt, hasFinalScore, opts?)` centraliza la lógica: 10 min pre-partido lejano, 1 min cerca, 30s (o `opts.liveTtl`) en directo, 1h post.

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

Para los crons hace falta repo en GitHub conectado, con dos secrets en Settings → Secrets and variables → Actions:
- `APP_URL` — URL pública (`https://porrabros.com`), sin barra final
- `CRON_SECRET` — el mismo valor que el env var en Vercel

## Gotchas

- `next-env.d.ts` está en `.gitignore` — Next lo regenera.
- El `dynamic = "force-dynamic"` está en `/g/[slug]/leaderboard` y `/g/[slug]/leaderboard/[userId]`. Las demás páginas son dinámicas de facto porque leen cookies (`getSession`).
- `matches-data.ts` usa `Date.UTC(Y, M-1, D, h-2, m)`. Ese `-2` es la conversión CEST→UTC; no lo toques sin saber qué haces.
- Crear un grupo bloquea el flujo si no hay torneos cargados — el admin global tiene que crear/seedear al menos uno.
- `magic_links` tiene basura acumulada — `gcMagicLinks()` se llama oportunísticamente desde `login` (cuando manda link transicional) y `forgot-password`. No hace falta cron.
- Owner del grupo NO puede salir vía DELETE — debe borrar el grupo entero.
