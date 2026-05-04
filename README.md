# ⚽ La Porra · Mundial 2026

App web para hacer una porra del Mundial 2026 con tus amigos. Pronósticos por partido, clasificación en directo, panel de administración para introducir resultados.

**Stack:** Next.js 14 · Postgres (Neon) · Drizzle ORM · Tailwind CSS · Vercel

---

## 🚀 Despliegue paso a paso (todo gratis)

### 1. Crear la base de datos en Neon

1. Ve a **[console.neon.tech](https://console.neon.tech)** y crea una cuenta gratis.
2. Crea un proyecto nuevo. Elige la región más cercana (`Frankfurt` o `Dublin` para España).
3. Copia el **connection string** que te dan (algo como `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
4. Guárdalo, lo necesitarás en breve.

> Free tier de Neon: 0.5 GB de almacenamiento. Para 30 personas × 72 partidos sobra MUCHO.

### 2. Subir el código a GitHub

```bash
cd porra-mundial
git init
git add .
git commit -m "Porra Mundial 2026"
# Crea un repo nuevo en github.com (puede ser privado) y luego:
git remote add origin https://github.com/TU_USUARIO/porra-mundial.git
git branch -M main
git push -u origin main
```

### 3. Desplegar en Vercel

1. Ve a **[vercel.com](https://vercel.com)** y entra con tu cuenta de GitHub.
2. Click en **Add New → Project**, selecciona el repo `porra-mundial`.
3. En **Environment Variables** añade tres:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | El connection string de Neon (paso 1) |
| `JWT_SECRET` | Una cadena aleatoria larga (genera con `openssl rand -base64 48`) |
| `ADMIN_PASSWORD` | La contraseña que tú usarás como organizador |

4. Click en **Deploy**. Espera ~2 minutos.

### 4. Inicializar la base de datos

Una vez desplegado, hay que crear las tablas y cargar los partidos. Lo más fácil es hacerlo desde tu ordenador apuntando a la DB de Neon:

```bash
# Crea un .env local con las mismas variables que en Vercel:
cp .env.example .env
# Edita .env con tus valores reales

# Crea las tablas:
pnpm db:push

# Carga los 72 partidos del Mundial y crea el usuario admin:
pnpm db:seed
```

> El admin se crea con nombre `admin` y la contraseña que pusiste en `ADMIN_PASSWORD`.

### 5. Listo

Abre `https://tu-app.vercel.app` (la URL que te ha dado Vercel).

- Entra como `admin` con tu contraseña.
- Ve al panel **Admin → Participantes** y crea uno por uno a tus amigos. La app genera un PIN de 4 dígitos para cada uno.
- Comparte cada nombre + PIN con su dueño. Ya pueden entrar y empezar a pronosticar.

---

## 📐 Reglas de la porra

- **3 puntos** → resultado exacto.
- **1 punto** → aciertas el signo (ganador o empate) pero no el resultado.
- **0 puntos** → fallo.

Las predicciones se cierran automáticamente al pitido inicial de cada partido.

---

## 🛠 Desarrollo local

```bash
pnpm install
cp .env.example .env  # rellena los valores
pnpm db:push          # crea tablas
pnpm db:seed          # carga partidos + admin
pnpm dev              # http://localhost:3000
```

---

## 📂 Estructura

```
app/
  page.tsx                  → home
  login/                    → login
  predictions/              → pronósticos del usuario
  leaderboard/              → clasificación con auto-refresh
  admin/                    → panel admin (resultados + participantes)
  api/                      → endpoints REST
components/                 → React components
lib/
  db/                       → schema y cliente Drizzle
  matches-data.ts           → 72 partidos del Mundial 2026
  scoring.ts                → cálculo de puntos
  session.ts                → JWT en cookie httpOnly
scripts/seed.ts             → poblar DB
```

---

## ⚠️ Notas

- Las horas de los partidos están en **hora peninsular española** (CEST). Si juegas desde otra zona horaria, ajusta `lib/matches-data.ts`.
- La app usa **JWT en cookie httpOnly** para sesiones. Sin librerías de auth pesadas.
- La clasificación se actualiza sola cada **30 segundos** mientras la tienes abierta.
- El bloqueo de predicciones es por hora del servidor: si Neon o Vercel tienen drift, podría haber un margen de pocos segundos.

## 🔧 Si algo va mal

- **Build falla en Vercel:** comprueba que las 3 env vars están definidas.
- **Login no funciona:** si cambiaste `ADMIN_PASSWORD` después del seed, vuelve a ejecutar `pnpm db:seed` (es idempotente, pero solo crea el admin si no existe; bórralo manualmente desde Neon si necesitas resetear).
- **No aparecen los partidos:** ejecutaste `db:seed`? Comprueba `Tablas → matches` en el dashboard de Neon.
