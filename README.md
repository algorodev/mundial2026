# ⚽ PorraBros

Plataforma para hacer porras de deportes entre amigos. Un grupo = una porra de un torneo (Mundial 26, Champions, lo que cargues). Los miembros pronostican, el admin global mete los resultados, la clasificación se actualiza sola.

**Stack:** Next.js 14 · Postgres (Neon) · Drizzle ORM · Tailwind · Auth con email + contraseña (bcryptjs) · Resend para emails · Vercel

---

## 🚀 Despliegue

### 1. Base de datos en Neon

1. Crea un proyecto en **[console.neon.tech](https://console.neon.tech)** (free tier sobra para amigos).
2. Copia el connection string (`postgresql://...?sslmode=require`).

### 2. Resend para los emails (set/reset password)

1. Cuenta gratis en **[resend.com](https://resend.com)**.
2. Verifica tu dominio en **Domains** (añade los DNS records que te pida).
3. Crea una API key en **API Keys** y guárdala como `RESEND_API_KEY`.

Mientras pruebas puedes usar `EMAIL_FROM="PorraBros <onboarding@resend.dev>"` sin verificar dominio, pero solo recibirás emails en tu cuenta de Resend.

### 3. Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Neon |
| `JWT_SECRET` | Cookie de sesión. Mín 32 chars (`openssl rand -base64 48`) |
| `APP_URL` | URL pública (`https://porrabros.com`). Se usa para construir los enlaces del email |
| `RESEND_API_KEY` | API key de Resend |
| `EMAIL_FROM` | Remitente (dominio verificado en Resend) |
| `ADMIN_EMAIL` *(opcional, solo en seed)* | Email que se promociona a global admin al ejecutar `pnpm db:seed` |

### 4. Inicializar DB

Desde local con un `.env` que apunte a la DB de Neon:

```bash
pnpm install
pnpm db:push     # crea las tablas
pnpm db:seed     # crea torneo "Mundial 2026" con sus 72 partidos
                 # y promociona ADMIN_EMAIL a global admin (si está)
```

### 5. Listo

Abre la URL de Vercel, pulsa **Entrar**. Si tu email coincide con `ADMIN_EMAIL`, mete tu email y cualquier password — el sistema verá que aún no tienes contraseña fijada y te mandará un enlace para crearla. Tras pulsarlo y elegir password ya entras y ves el panel **Admin**. Alternativa rápida sin SMTP: `pnpm admin-link` te imprime un enlace local de "crear contraseña".

Para empezar a porrear:
1. Pulsa **Crear grupo**, ponle nombre y elige torneo (de momento, Mundial 2026).
2. Ve a **Gestionar** → copia el enlace de invitación → mándalo a tu pandilla por WhatsApp.
3. Cada uno crea su cuenta (nombre + email + password), pronostica los 72 partidos antes del primer pitido.
4. Tú (admin global) metes resultados → la clasificación del grupo se actualiza en directo.

---

## 📐 Reglas de la porra

- **3 puntos** → resultado exacto.
- **1 punto** → aciertas el signo (ganador o empate) pero no el resultado.
- **0 puntos** → fallo.

Las predicciones se cierran cuando empieza el primer partido del torneo. A partir de ahí puedes ver los pronósticos del resto del grupo.

---

## 🛠 Desarrollo local

```bash
pnpm install
cp .env.example .env  # rellena los valores
pnpm db:push
pnpm db:seed
pnpm dev              # http://localhost:3000
```

### Simulador 24 h

Para probar el leaderboard sin esperar al Mundial real, comprime el calendario en 24 h:

```bash
pnpm sim          # arranca la simulación sobre el torneo "mundial-2026"
pnpm sim:reset    # restaura los kickoffs reales y limpia resultados
```

---

## 📂 Estructura

```
app/
  page.tsx                  → landing pública
  login/                    → form email + password
  register/                 → alta de cuenta (nombre + email + password)
  forgot-password/          → pide enlace para resetear password
  auth/set-password/        → form para fijar password tras pulsar el enlace
  groups/                   → mis porras + crear grupo
  g/[slug]/                 → página del grupo (predicciones / leaderboard / manage)
  join/[code]               → aceptar invitación
  admin/                    → panel del global admin (lista torneos + resultados)
  api/                      → endpoints REST (auth: login, register, forgot-password, set-password, logout)
components/                 → React components
lib/
  db/schema.ts              → tablas: users (con passwordHash nullable), tournaments,
                              matches, groups, group_members, predictions, magic_links
  auth.ts                   → magic link create/peek/consume (solo para set/reset password)
  password.ts               → bcryptjs: hashPassword, verifyPassword, validatePassword
  email.ts                  → Resend SDK + plantilla "crea/restablece tu contraseña"
  group-access.ts           → check de membresía
  scoring.ts                → cálculo de puntos
  session.ts                → JWT en cookie httpOnly
  matches-data.ts           → 72 partidos del Mundial 2026 (datos para seed)
scripts/
  seed.ts                   → torneo Mundial + partidos + admin
  simulate.ts               → simulador 24 h
  admin-link.ts             → genera enlace local de "crear contraseña" (sin SMTP)
```

---

## ⚠️ Notas

- Auth con **email + contraseña** (bcryptjs, mín 8 chars). Magic links sólo para fijar/resetear password — válidos 15 min, un solo uso.
- Cuentas "transicionales" (creadas por seed/admin-link o que vienen de la era magic-link sin password): al hacer login el sistema lo detecta y manda un email para fijar la contraseña.
- Las horas de los partidos del Mundial están en **CEST** (España, junio 2026). Si añades torneos con otras zonas, ajusta el `iso()` helper de `matches-data.ts` o crea uno nuevo.
- Un grupo = un torneo. Si quieres dos porras (una de la Champions y otra del Mundial), crea dos grupos.
- El admin global no aparece en los leaderboards a menos que también sea miembro del grupo.

## 🔧 Si algo va mal

- **Build falla en Vercel:** comprueba que están `RESEND_API_KEY` + `EMAIL_FROM` + `JWT_SECRET` + `DATABASE_URL` + `APP_URL`.
- **No llega el email:** revisa que el dominio de `EMAIL_FROM` esté verificado en Resend (sección Domains). Si la API key es de un entorno con sandbox, solo enviará a tu propio email.
- **No me reconoce como admin:** ejecutaste `db:seed` con `ADMIN_EMAIL` puesto? También puedes promocionarte a mano: `UPDATE users SET is_global_admin = 1 WHERE email = 'tu@email.com';`
- **Cambiar `ADMIN_EMAIL` después del primer seed:** `db:seed` es idempotente — vuelve a ejecutarlo con el nuevo valor y promocionará al nuevo email (no degrada al anterior; baja `is_global_admin` a mano si quieres).
