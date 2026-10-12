# CAi · PWA del Centro de Alumnos de Ingeniería UC (MVP)

Demo desplegable en Vercel (plan Hobby) con dos funciones reales: **noticias personalizadas por temas con notificaciones push** y un **canal de reportes** que en este MVP es solo una maqueta visual (la clasificación con LLM queda diseñada pero pendiente).

> ⚠️ **Demo de presentación.** El panel `/admin` y sus rutas API están **abiertos sin ninguna protección**. No uses esta demo con datos reales ni con suscriptores reales. Ver "Diseñado sin implementar".

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript estricto · Tailwind 4 + shadcn/ui · Prisma 6 + PostgreSQL (Neon o Supabase) · Zod · `web-push` (VAPID) · service worker a mano (`public/sw.js`) · Vitest + Testing Library · Motion (solo vistas mock).

## Cómo correr en local

Requisitos: Node 20+, pnpm 10, una base PostgreSQL.

```bash
pnpm install                  # instala y genera el cliente Prisma
cp .env.example .env          # completa DATABASE_URL, SESSION_SECRET y las claves VAPID
pnpm vapid                    # imprime un par de claves VAPID → NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
pnpm db:push                  # crea las tablas (o pnpm db:migrate para migraciones)
pnpm db:seed                  # temas y noticias de ejemplo
pnpm dev                      # http://localhost:3000
```

Otros comandos:

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm test        # vitest
pnpm build       # prisma generate && next build
pnpm check       # typecheck + lint + test + build
pnpm db:studio   # Prisma Studio
node scripts/generate-icons.mjs   # regenera los íconos PNG de public/icons
```

Variables de entorno: ver [.env.example](.env.example). `SESSION_SECRET` firma la cookie de dispositivo (`openssl rand -base64 32`). `CRON_SECRET` protege `/api/cron/digest`.

### Generar las claves VAPID

```bash
pnpm vapid
# o: npx web-push generate-vapid-keys
```

Copia `publicKey` en `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `privateKey` en `VAPID_PRIVATE_KEY`. `VAPID_SUBJECT` debe ser un `mailto:` o una URL `https:` de contacto. Si cambias las claves, las suscripciones existentes dejan de funcionar (el servicio push responde 403/410 y se borran solas en el siguiente envío).

## Desplegar en Vercel con Neon

1. Crea un proyecto en [Neon](https://neon.tech) y copia la cadena de conexión **pooled** (para `DATABASE_URL`) y la **direct** (para `DIRECT_URL`).
2. Importa el repo en Vercel. Framework: Next.js. Build command por defecto (`pnpm build` ejecuta `prisma generate && next build`).
3. Variables de entorno en Vercel: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET` y, opcionalmente, `NEXT_PUBLIC_APP_URL` (si no, se usa `VERCEL_URL`).
4. Crea las tablas y el seed desde tu máquina apuntando a Neon:
   ```bash
   DATABASE_URL="postgresql://...direct..." DIRECT_URL="postgresql://...direct..." pnpm db:push
   DATABASE_URL="postgresql://...direct..." pnpm db:seed
   ```
   (o usa `pnpm db:deploy` si generaste migraciones con `pnpm db:migrate`).
5. Despliega. La PWA necesita HTTPS: Vercel lo da por defecto.

Supabase funciona igual: usa la cadena del pooler (puerto 6543, `?pgbouncer=true`) en `DATABASE_URL` y la directa (5432) en `DIRECT_URL`.

## Probar push en un iPhone real

Requisitos: iOS/iPadOS **16.4 o superior**, Safari, y la app **agregada a la pantalla de inicio** (Apple solo permite push a web apps instaladas).

1. Abre la URL de producción (HTTPS) en Safari.
2. Toca **Compartir → Agregar a pantalla de inicio**. La app muestra un banner con estos pasos cuando detecta Safari en iOS sin instalar.
3. Abre **CAi desde el ícono de la pantalla de inicio** (no desde Safari).
4. Ve a **Más → Preferencias**, elige temas y toca **Activar avisos**. iOS pide permiso solo después de ese toque.
5. Desde otro dispositivo entra a `/admin/noticias/nueva`, crea una noticia en uno de tus temas con la casilla **Enviar notificación push** marcada y publica.
6. La notificación llega aunque la app esté cerrada; al tocarla se abre la noticia. En `/admin/entregas` ves el resultado de cada envío.

Notas: si el usuario desactiva los avisos en Ajustes de iOS, el servicio push responde 410 y la suscripción se borra sola en el siguiente envío. En Android/Chrome y escritorio no hace falta instalar la app.

## Incluido en MVP vs Diseñado sin implementar

| Función | Estado | Notas |
|---|---|---|
| Sesión anónima por dispositivo (cookie httpOnly firmada) | ✅ Incluido | `proxy.ts`, `lib/session/*` |
| Pantalla `/login` | 🎨 Solo visual | No valida ni envía correo; navega al feed |
| Auth real (código por correo, solo `@uc.cl`, rol admin por `ADMIN_EMAILS`) | 📐 Diseñado | `lib/auth/auth-service.ts`, modelo `LoginCode`, plan de migración en `docs/DECISIONS.md` |
| Acceso admin | ⚠️ Abierto | `requireAdmin()` no verifica nada (`lib/auth/admin.ts`). No usar con datos reales |
| Preferencias por temas (lista configurable en seed) | ✅ Incluido | `/preferencias` |
| Feed filtrado por temas + detalle de noticia | ✅ Incluido | `/`, `/noticias/[id]` |
| Recomendador | 📐 Diseñado | `Recommender.rank()`; hoy solo coincide por temas. `Interaction` registra impresiones y clics |
| Admin de noticias con casilla "enviar push" | ✅ Incluido | `/admin/noticias` |
| PWA: manifest, íconos, service worker, banner iOS, botón "Activar avisos" | ✅ Incluido | `app/manifest.ts`, `public/sw.js`, `components/push/*` |
| Push: destinatarios por tema, notificación visible siempre, borrado 404/410, log de entregas, concurrencia y tope por invocación | ✅ Incluido | `lib/services/push/*`, runtime Node, `maxDuration 60` |
| Vista admin de entregas push | ✅ Incluido | `/admin/entregas` |
| Cola de envíos | 📐 Diseñado | `PushQueue`; `InlineQueue` envía directo y registra el exceso en `NotificationJob`. Sin worker ni Redis |
| Digest programado | 📐 Diseñado | `/api/cron/digest` protegido con `CRON_SECRET`, handler vacío, no declarado en `vercel.json` |
| Reportes (formulario) | 🧪 Solo maqueta | `/reportes`: estado en memoria, nada se guarda. Para volverlo real: ruta `POST /api/reports` que llame a `createReport` |
| Reportes (lista admin con filtros y cambio de estado) | 🧪 Solo maqueta | `/admin/reportes` con datos de `lib/mocks/reports.ts` |
| Clasificación de reportes con LLM | 📐 Diseñado | Esquema Zod `ReportClassification`, `ReportClassifier` + `UnavailableClassifier`. Sin SDK en el MVP |
| Límite de 2 reportes por usuario por día | 📐 Diseñado | `checkReportQuota()` siempre permite; regla y plan en `docs/DECISIONS.md` |
| Modelo `Report` en Prisma | ✅ Incluido | Sin escrituras en el MVP |
| Base de conocimiento, preguntas y respuestas, bot de WhatsApp | ⛔ Fuera de alcance | La lógica de dominio vive en `lib/services/*` sin depender de HTTP |
| Calendario de actividades (`/calendario`) | 🧪 Solo maqueta | Para volverlo real: tablas `Event`/`EventRegistration`, generación y servicio real de `.ics`, inscripción con el usuario autenticado |
| Logros / bucket list (`/logros`) | 🧪 Solo maqueta | Para volverlo real: tablas `Mission`/`MissionProgress`, subida de foto de evidencia a un storage, validación por el CAi |
| Pasarela de pagos (`/pagos`) | 🧪 Solo maqueta | Para volverlo real: integrar un procesador de pagos vía su checkout hospedado, webhook de confirmación y tabla `Order` |
| Manual novato (`/manual`) | 🧪 Solo maqueta | Para volverlo real: contenido editable (CMS o Markdown en repo) e ilustraciones reales; la estructura de capítulos ya está en `lib/mocks/manual.ts` |
| CAiPuntos (`/puntos`) | 🧪 Solo maqueta | Para volverlo real: tabla `PointsLedger` con movimientos firmados por el CAi, catálogo `Reward` y canje con stock |
| Galería (`/galeria`) | 🧪 Solo maqueta | Para volverlo real: storage de imágenes con consentimiento, álbumes y moderación |
| Préstamos y solicitudes (`/prestamos`) | 🧪 Solo maqueta | Para volverlo real: tablas `InventoryItem`/`LoanRequest`, aprobación desde admin y notificación al estudiante |
| Contenido de cai.cl | 🧪 Solo estructura | `lib/mocks/cai-content.ts` con placeholders "pendiente de migrar"; migrar textos con permiso del CAi |

Leyenda: ✅ funcional · 🎨 solo visual · 🧪 maqueta sin backend · 📐 interfaz/modelo/documentación sin implementación · ⚠️ sin protección · ⛔ fuera de alcance.

### Navegación y vistas mock

La barra inferior tiene Inicio (noticias), Calendario, Logros, CAiPuntos y "Más" (Manual novato, Galería, Préstamos, Pagos, Reportes, Preferencias y Admin). Las vistas marcadas con la etiqueta **Maqueta** no tienen backend: sus datos salen de `lib/mocks/*.ts` (tipados en `lib/types/*.ts`), el estado vive en memoria y se pierde al recargar. `/manual` se carga de forma diferida con `next/dynamic` y es la única vista con animación intensa (Motion); todas respetan `prefers-reduced-motion`.

## Decisiones tomadas

Resumen (detalle en [docs/DECISIONS.md](docs/DECISIONS.md)):

- **Service worker a mano en vez de Serwist**: el MVP no necesita offline; Serwist con Next 16/Turbopack exige un paso de build extra. `public/sw.js` solo maneja `push` y `notificationclick`.
- **Prisma 6** (no 7) para evitar driver adapters y mantener compatibilidad directa con Neon/Supabase.
- **Cache Components y React Compiler apagados**: todas las páginas son dinámicas por la cookie de sesión.
- **Cookie creada en `proxy.ts`, usuario creado de forma perezosa** en `getCurrentUser()`; el proxy no toca la base.
- **Cola inline** con tope de destinatarios y `NotificationJob` para el exceso; drenado manual con "Enviar push ahora".
- **Sin SDK de LLM**: el contrato de clasificación es un esquema Zod y una interfaz; la implementación con el SDK oficial de Anthropic queda documentada.
- **Reportes como maqueta** (formulario y lista admin), con el modelo y los servicios listos para enchufar.
- **Admin abierto** en un único punto (`requireAdmin()`), con aviso permanente en la UI.

## Limitaciones de Hobby

- Funciones serverless de **10 s por defecto y 60 s máximo**. Las rutas que envían push declaran `maxDuration = 60` y limitan destinatarios por invocación (`PUSH_MAX_RECIPIENTS_PER_INVOCATION`, default 200).
- **Cron como máximo una vez al día** (y con ventana de una hora). Por eso el digest no está declarado.
- **Uso no comercial** únicamente.
- Sin procesos de larga duración: nada de workers, Redis ni BullMQ en este plan.

## Estructura

```
app/                 rutas (App Router) y componentes de página
  api/               route handlers (Node runtime)
  admin/             panel de administración (abierto en el MVP)
components/          UI compartida (shadcn en components/ui, push, layout)
lib/
  services/          lógica de dominio sin HTTP (news, topics, push, reports, recommender)
  session/           cookie firmada y usuario de dispositivo
  auth/              requireAdmin() y las interfaces de auth futura
  validation/        esquemas Zod de entrada
  mocks/, types/     datos y tipos de las vistas mock
prisma/              schema.prisma y seed.ts
public/sw.js         service worker
tests/               vitest (unitarios y smoke de vistas mock)
docs/DECISIONS.md    decisiones y diseño de lo no implementado
```

## Tests

```bash
pnpm test
```

Cubren: selección de destinatarios por tema, limpieza de suscripciones 404/410 y concurrencia del envío, validación del esquema `ReportClassification` (sin llamar a ningún LLM), firma de la cookie de dispositivo y tests de humo de cada vista mock.
