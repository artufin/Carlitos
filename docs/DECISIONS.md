# Decisiones tomadas

Registro de las decisiones de diseño del MVP. Cada punto marcado **NOT IMPLEMENTED (MVP)** existe como interfaz, modelo de datos o documentación, pero no tiene implementación real. En el código, busca el comentario `// NOT IMPLEMENTED (MVP)` para ubicar cada punto de enchufe.

## Stack y herramientas

- **Next.js 16 (App Router) con Turbopack, TypeScript estricto, Tailwind 4 y shadcn/ui.** shadcn se inicializó con el preset por defecto (`base-nova`), que usa `@base-ui/react` en vez de Radix. Los componentes viven en `components/ui`.
- **Cache Components y React Compiler desactivados** (`next.config.ts`). Todas las páginas dependen de la cookie de sesión y de la base, así que se renderizan de forma dinámica (`export const dynamic = "force-dynamic"`). Menos magia, menos sorpresas en una demo.
- **Prisma 6 con `prisma-client-js`** en vez de Prisma 7. Prisma 7 exige driver adapters y `prisma.config.ts`; Prisma 6 funciona con `DATABASE_URL` directo, Neon y Supabase. `DIRECT_URL` existe para migraciones cuando `DATABASE_URL` apunta a un pooler.
- **pnpm** como gestor de paquetes (Vercel lo detecta por `packageManager`). Los scripts de build de Prisma y esbuild están aprobados en `pnpm-workspace.yaml`.
- **Vitest + Testing Library + jsdom** para tests. Los tests de componentes declaran `// @vitest-environment jsdom`; `tests/setup.ts` agrega `matchMedia`, `IntersectionObserver` y `ResizeObserver`.
- **Dependencias extra respecto del enunciado:** solo las que exige el propio enunciado (shadcn trae `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css`; los tests traen `vitest`, `jsdom`, `@testing-library/*`; el seed usa `tsx`) y **Motion**, permitida por la ampliación de vistas mock. No hay SDK de Anthropic ni de ningún otro LLM.

## Service worker a mano (sin Serwist)

El MVP no necesita precaching ni modo offline; solo necesita recibir push y abrir la noticia al tocar la notificación. Serwist con Next 16 y Turbopack obliga a un paso de build aparte (`@serwist/cli`) y solo se puede probar en producción. Por eso `public/sw.js` es JavaScript plano con `// @ts-check`, sin paso de build, idéntico en desarrollo y producción. Si más adelante se quiere offline, Serwist puede envolver este mismo archivo (sus handlers de `push` y `notificationclick` no cambian).

## Identidad: sesión anónima por dispositivo

- `proxy.ts` garantiza que toda petición lleve la cookie `cai_device` (httpOnly, SameSite=Lax, Secure en producción, 1 año). El valor es `<uuid>.<HMAC-SHA256(uuid, SESSION_SECRET)>`, firmado con Web Crypto (`lib/session/cookie.ts`).
- El usuario (`User.deviceId`) se crea de forma perezosa en `getCurrentUser()` la primera vez que algo lo necesita. El proxy nunca toca la base.
- Todo lo dependiente de usuario (temas, suscripciones push, interacciones, reportes identificados) cuelga de `User.id`.

## Cuentas: correo + contraseña

- Registro con nombre, **cualquier correo** y contraseña (mín. 8, validada en servidor y en el formulario), confirmado con un **código de 6 dígitos enviado por correo**. Rutas `POST /api/auth/{register,verify,resend,login,logout}` y `GET /api/auth/me`; lógica en `lib/auth/auth-service.ts`; validación Zod en `lib/validation/auth.ts` (también la usa el formulario, por eso no importa nada de servidor).
- Contraseñas con `scrypt` nativo de Node (`lib/auth/password.ts`), formato `scrypt$N$r$p$sal$hash`. Login fallido verifica contra un hash ficticio si el correo no existe, para no filtrar qué correos tienen cuenta.
- Sesión en la cookie `cai_session` (httpOnly, SameSite=Lax, 30 días): `<userId>.<expira>.<HMAC("session:"+…)>`. El prefijo impide reutilizar una cookie de dispositivo como sesión. `getCurrentUser()` devuelve la cuenta si la sesión es válida y, si no, el usuario de dispositivo, así que el resto del código no cambió.
- **Registro**: crea una fila de cuenta aparte (no toca al usuario de dispositivo) con `emailVerifiedAt = null` y envía un código. Si el correo ya tiene una cuenta **verificada** responde 409; si está pendiente, reemplaza nombre y contraseña y reenvía (gana quien tenga acceso al buzón). No hay sesión hasta verificar.
- **Código** (`LoginCode`): 6 dígitos, guardado como HMAC con `SESSION_SECRET`, vence en 10 minutos, máximo 5 intentos fallidos, solo vale el último (emitir uno invalida los anteriores), reenvío como mínimo cada 60 s. `/api/auth/resend` responde igual exista o no la cuenta.
- **Envío** (`lib/auth/email.ts`, todo vía `fetch`, sin SDKs): se usa el primer proveedor con clave. (1) `BREVO_API_KEY` → API transaccional de Brevo; plan gratis y basta un remitente verificado (sin dominio propio), así que es la opción gratuita para enviar a cualquiera; `EMAIL_FROM` obligatorio y debe ser ese remitente; la clave solo necesita "Emails transaccionales: Todos". Contra: al salir "a nombre de" un Gmail desde servidores de Brevo puede caer en spam. (2) `RESEND_API_KEY` → Resend, remitente `EMAIL_FROM` o `onboarding@resend.dev`; sin dominio verificado solo entrega al correo de la cuenta Resend. (3) Sin clave, solo en desarrollo, imprime el código en la consola del servidor; en producción sin clave responde 503. Los errores del proveedor se loguean con estado y código, nunca con la clave.
- **Verificar**: marca `emailVerifiedAt`, fusiona el usuario de dispositivo en la cuenta e inicia la sesión. Un login con contraseña correcta en una cuenta sin verificar envía un código nuevo y responde 403 `verificationRequired`.
- **Bloqueo progresivo de login** (`lib/auth/throttle.ts`, tabla `LoginThrottle` por correo): 3 intentos fallidos libres; al 3.º se bloquea 30 s, y cada fallo siguiente duplica la espera (1 min, 2 min, …) hasta 15 min. Durante el bloqueo responde 429 con `retryAfter` (el formulario muestra la cuenta regresiva), incluso con la contraseña correcta. Un login correcto reinicia el contador; fallos de hace más de 24 h se olvidan. Se aplica también a correos sin cuenta, para no revelar cuáles existen. Contra: un tercero puede bloquear temporalmente el correo de otro.
- **Fusión** (verificar y login): se mueven a la cuenta las `PushSubscription`, `Interaction`, `PushDelivery` y `Report` del usuario de dispositivo; los `UserTopic` solo si la cuenta no tiene temas propios. Luego se borra el usuario de dispositivo.
- **Logout**: borra `cai_session` y rota la cookie de dispositivo (el navegador vuelve a ser un visitante anónimo nuevo).
- **NOT IMPLEMENTED (MVP):** recuperar contraseña, cerrar sesión en todos los dispositivos (la cookie es válida hasta que expira) y rol `ADMIN` según `ADMIN_EMAILS`.

## Acceso admin abierto

**NOT IMPLEMENTED (MVP).** `/admin` y `/api/admin/*` están abiertos a cualquiera. `requireAdmin()` en `lib/auth/admin.ts` es el único punto de enchufe: hoy devuelve `{ actor: "demo" }` y no verifica nada; cada página y ruta admin lo llama. Cuando exista auth real, basta con lanzar `AdminForbiddenError` cuando `user.role !== "ADMIN"` (ya mapeado a 403 en `lib/http.ts`). El panel muestra un aviso permanente. **No usar esta demo con datos reales ni con suscriptores reales.**

## Preferencias y feed

- Temas configurables en `prisma/seed.ts` (`TOPICS`). El usuario elige cualquier subconjunto; un usuario sin temas ve todas las noticias (caso de onboarding) con una invitación a elegir temas.
- `Recommender.rank(user, news[])` (`lib/services/recommender.ts`) es la única puerta del feed. **NOT IMPLEMENTED (MVP): ML.** `TopicRecommender` filtra por temas y ordena por fecha. La tabla `Interaction` registra impresiones (una por usuario/noticia/24 h) y clics desde ya para alimentar una futura versión.

## Push

- Envío solo desde runtime Node (`export const runtime = "nodejs"`) con `maxDuration = 60` en las rutas que envían.
- Destinatarios = todas las suscripciones de los usuarios que siguen el tema (`selectRecipients`, función pura con test).
- `sendToSubscriptions` (`lib/services/push/sender.ts`): concurrencia limitada (`PUSH_CONCURRENCY`, default 10), registra cada intento en `PushDelivery`, y borra la suscripción si el servicio push responde 404 o 410. Nunca falla por un destinatario.
- Tope de destinatarios por invocación `PUSH_MAX_RECIPIENTS_PER_INVOCATION` (default 200). Con concurrencia 10 y ~0,3 s por envío son ~6 s, muy por debajo de los 60 s.
- **Cada push termina en una notificación visible**: `sw.js` llama a `showNotification` incluso si el payload no se puede parsear (iOS cancela suscripciones silenciosas).
- Payload = título, resumen, URL absoluta de la noticia (`NEXT_PUBLIC_APP_URL` o `VERCEL_URL`), `tag` por noticia para no duplicar.
- Suscripciones: rate limit de 20 escrituras por usuario por hora, máximo 10 dispositivos por usuario (se borran los más antiguos), endpoint único (`upsert`). Nunca se loguean suscripciones completas ni endpoints.
- **NOT IMPLEMENTED (MVP): cola real.** `PushQueue` (`enqueue`, `status`) en `lib/services/push/types.ts`. `InlineQueue` envía dentro de la petición hasta el tope y deja el resto como `NotificationJob` PENDING (uno por usuario y noticia). Volver a pulsar "Enviar push ahora" drena los pendientes. Para una implementación real: un `BullMQQueue` que haga `queue.add({ newsId, userId })` y un worker en un servidor Node (o un `QStashQueue` / Vercel Queues que llame a una ruta `/api/push/worker` con un lote), ambos implementando `PushQueue` y usando el mismo `sendToSubscriptions`. Ningún llamador cambia: solo `getPushQueue()`.
- **NOT IMPLEMENTED (MVP): digest programado.** `/api/cron/digest` existe, exige `Authorization: Bearer <CRON_SECRET>` y devuelve `implemented: false`. No está declarada en `vercel.json`: en Hobby el cron corre como máximo una vez al día y la demo no lo necesita. Diseño: un push diario por usuario con el resumen de las noticias de sus temas desde el último digest.

## Reportes

- **El formulario de reportes es una maqueta** (`/reportes`): estado en memoria, sin ruta API, sin escrituras en la base. La lista admin (`/admin/reportes`) también es maqueta, con datos de `lib/mocks/reports.ts`. El modelo `Report` sí está en el esquema.
- **NOT IMPLEMENTED (MVP): clasificación con LLM.** `lib/services/reports/classification.ts` fija el contrato de salida (esquema Zod `ReportClassification`: categoría, lugar, gravedad 1 a 3, resumen de una línea, `missingInfo`). `ReportClassifier.classify(text)` tiene una única implementación, `UnavailableClassifier`, que devuelve `null` → el reporte quedaría `UNCLASSIFIED` y el admin podría reintentar. Implementación futura `AnthropicClassifier` (ver comentario en `lib/services/reports/classifier.ts`): SDK oficial `@anthropic-ai/sdk`, modelo desde `ANTHROPIC_MODEL` (default `claude-haiku-5-5`), salida estructurada validada con el mismo esquema Zod, sin herramientas, solo el texto del reporte como entrada (nunca correos ni ids), timeout corto, y respaldo a `null` si no hay `ANTHROPIC_API_KEY` o falla la llamada. El texto del usuario se trata como dato, no como instrucciones.
- `createReport(input, userId, classifier)` y `checkReportQuota(userId)` están en `lib/services/reports/index.ts`, sin ruta que los use. Al enchufar el formulario real basta con una ruta `POST /api/reports` que valide `reportInputSchema` y llame a `createReport`.
- **NOT IMPLEMENTED (MVP): límite diario.** Regla de producción: máximo 2 reportes por usuario por día en zona horaria de Chile, validada en servidor con mensaje claro. `checkReportQuota` siempre permite. Implementación: contar `Report` del usuario desde `startOfTodayInChile()` (ya implementada). Como los reportes anónimos no guardan `userId`, para contarlos hace falta un contador aparte (tabla `ReportQuota` por usuario y día) o un hash con clave del id del usuario guardado en el reporte. Con sesión por dispositivo, borrar cookies evade el límite: la regla depende de la auth real.

## Vistas mock (hito 6)

Todas las vistas de la ampliación son maquetas (`// NOT IMPLEMENTED (MVP)`): datos en `lib/mocks/*.ts`, tipos en `lib/types/*.ts`, estado en memoria, etiqueta "Maqueta" visible, sin rutas API ni tablas nuevas. Motion es la única dependencia extra y los estilos recargados se permiten solo en `/manual`, que se carga con `next/dynamic`. El contenido de cai.cl no se copió: `lib/mocks/cai-content.ts` solo tiene la estructura con placeholders "pendiente de migrar".

## Seguridad y privacidad

- Validación Zod en toda entrada (`lib/validation/*`, `lib/services/reports/input.ts`).
- Errores de dominio mapeados a HTTP en `withErrorHandling` sin exponer stack traces.
- Sin secretos en el repo (`.env` ignorado; `.env.example` documentado).
- Logs: solo contadores y códigos de estado; nunca textos de reportes, endpoints ni claves de suscripción.
- El clasificador futuro no recibe identificadores y no tiene herramientas.

## Limitaciones del plan Hobby de Vercel

- Funciones serverless: 10 s por defecto, 60 s máximo (`maxDuration = 60` en las rutas de envío). Por eso existe el tope de destinatarios por invocación y los jobs pendientes.
- Cron: como máximo una vez al día, y con precisión de una hora. El digest no está declarado.
- Uso no comercial.
- Sin procesos de larga duración ni Redis/BullMQ: la cola es inline por diseño.
