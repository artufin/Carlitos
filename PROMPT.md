# Objetivo
Construye el MVP de una PWA para el Centro de Alumnos de Ingeniería (CAi) de la PUC con dos funciones: (1) noticias personalizadas por preferencias, con notificaciones push, y (2) un canal para que estudiantes suban reportes (infraestructura, carga académica, etc.). En este MVP el canal de reportes es solo una maqueta visual y la clasificación de reportes con un LLM queda diseñada pero pendiente (sin SDK ni llamadas a ningún modelo). Este MVP es una demo desplegada en Vercel (plan Hobby). Entrega un repo listo para desplegar.

# Cómo trabajar
- No me hagas preguntas. Si algo es ambiguo, elige el default más simple y regístralo en docs/DECISIONS.md.
- Trabaja por hitos con un commit por hito: (1) base, DB y sesión anónima por dispositivo (con pantalla de login solo visual); (2) preferencias, noticias y admin; (3) PWA y push; (4) reportes como maqueta, más modelo de datos e interfaces del clasificador y de la cuota diaria (sin implementación real); (5) interfaces sin implementar, docs y tests; (6) vistas mock (sección "Ampliación: vistas mock"), con su navegación, tests de humo y actualización del README.
- Antes de terminar deben pasar typecheck, lint, tests y `next build`. El service worker es un archivo plano `public/sw.js` (sin paso de build) que funciona igual en desarrollo y producción.
- No agregues dependencias ni funcionalidades que no pedí (única excepción: Motion, ver "Ampliación: vistas mock").

# Stack
Next.js (App Router) con TypeScript estricto, Tailwind y shadcn/ui, Prisma con PostgreSQL (compatible con Neon y Supabase), Zod, librería web-push (VAPID). Service worker escrito a mano en `public/sw.js` (JavaScript plano con `// @ts-check` y JSDoc), sin Serwist ni precaching: solo maneja `push` y `notificationclick`. Sin SDK de Anthropic ni ningún otro cliente de LLM en el MVP (ver "Diseñado pero NO funcional"). UI en español de Chile, código y comentarios en inglés. Diseño mobile-first.

# Alcance funcional (debe funcionar en Vercel)
1. Identidad (sin auth real en el MVP): la primera visita crea un usuario anónimo y guarda su id en una cookie httpOnly firmada con SESSION_SECRET. Todo lo que dependa de un usuario (preferencias, suscripciones push, límite de reportes) se asocia a ese id. Existe una pantalla `/login` solo visual (campo de correo @uc.cl, paso de ingreso de código, estilos finales) que no valida, no envía correo y al continuar simplemente lleva al feed; márcala con `// NOT IMPLEMENTED (MVP)` y muestra un aviso discreto "Demo: el inicio de sesión aún no está activo". Acceso admin: en el MVP `/admin` y sus rutas API quedan abiertos, sin ninguna protección (es una demo de presentación). Márcalo con `// NOT IMPLEMENTED (MVP)` en un único punto central (por ejemplo `requireAdmin()` que hoy no verifica nada y es el lugar donde se enchufará la autorización real), úsalo en cada ruta y página admin, y regístralo en docs/DECISIONS.md y en el README con una advertencia clara: no usar con datos reales ni con suscriptores reales.
2. Preferencias: el usuario elige temas (vida universitaria, rol público, feminismo, académico, infraestructura, etc.; lista configurable en el seed) y puede editarlos.
3. Noticias: feed filtrado por los temas del usuario. El admin crea y edita noticias con un tema y una casilla "enviar notificación push".
4. PWA: manifest, íconos, service worker a mano (`public/sw.js`) registrado desde un componente cliente, que maneje `push` y `notificationclick` (abre la URL de la noticia). Sin caché ni modo offline (documentar que se podría agregar Serwist después sobre el mismo archivo). Banner con instrucciones para agregar a la pantalla de inicio en iOS. Botón "Activar avisos" que pide el permiso solo después de un toque del usuario. Guardar la suscripción en la base.
5. Push: envío desde runtime Node (no Edge). Destinatarios de una noticia = suscritos a su tema. Reglas obligatorias:
   - Cada push DEBE terminar mostrando una notificación visible (iOS cancela suscripciones si no ocurre).
   - Borrar suscripciones que respondan 404 o 410.
   - Registrar el resultado de cada envío.
   - Concurrencia limitada (por ejemplo 10) y tope de destinatarios por invocación, respetando `maxDuration` (máximo 60 s). Lo que exceda el tope se registra como job pendiente (ver sección siguiente).
6. Reportes: en el MVP son SOLO MAQUETA (ver vista "Reportes" en "Ampliación: vistas mock"). No existe ruta API de reportes ni se guarda nada en la base. El modelo `Report` sí queda en el esquema Prisma y la lógica de dominio futura queda como interfaces en `lib/services/reports` (ver "Diseñado pero NO funcional").
7. Admin: lista de noticias; vista de entregas push; lista de reportes como maqueta (datos de `lib/mocks/reports.ts`, filtros por categoría, gravedad y estado, y cambio de estado solo en memoria), marcada "Maqueta" y bajo `requireAdmin()` igual que el resto.
8. Seed con datos de ejemplo.

# Seguridad y privacidad (obligatorio)
- Reglas para el clasificador futuro (déjalas documentadas junto a la interfaz, aunque hoy no se ejecute): el texto del usuario es dato, no instrucciones; el LLM no tiene herramientas y su salida solo se acepta si valida el esquema; nunca se le envían correos ni identificadores de usuario, solo el texto del reporte.
- Rate limit por usuario (id de dispositivo) en suscripciones. Validación Zod en toda entrada. Toda ruta y página admin pasa por `requireAdmin()` (hoy sin verificación, ver Alcance funcional).
- Sin secretos en el repo. No loguear textos de reportes ni suscripciones push completas.

# Diseñado pero NO funcional en este MVP
Deben existir como interfaz, modelo de datos y documentación, pero sin implementación real. Márcalos en el código con `// NOT IMPLEMENTED (MVP)` y en el README.
- Auth real: login con código de un solo uso por correo, solo dominio @uc.cl, sesión en cookie httpOnly firmada y rol admin según ADMIN_EMAILS. Deja las interfaces `EmailSender` (en desarrollo imprimiría el código en consola) y `AuthService` (`requestCode`, `verifyCode`) sin implementar, un modelo `LoginCode` en el esquema si hace falta, y documenta cómo reemplazar la sesión anónima por usuarios reales (migrar el id de dispositivo al usuario) sin tocar el resto del código. La pantalla `/login` visual ya es la UI final.
- Reportes reales y clasificación con LLM: en el MVP el formulario es maqueta y no hay SDK de ningún proveedor. Deja en `lib/services/reports`:
  - El modelo `Report` en Prisma (texto, categoría opcional, userId opcional para anónimo/identificado, estado, campos de clasificación nulos) y el tipo `ReportClassification` definido como esquema Zod: categoría, lugar, gravedad (1 a 3), resumen de una línea e indicador de información faltante.
  - La interfaz `ReportClassifier` con `classify(text): Promise<ReportClassification | null>` y una única implementación `UnavailableClassifier` que siempre devuelve `null` (`// NOT IMPLEMENTED (MVP)`), de modo que un reporte quedaría "sin clasificar" y el admin podría reintentar más adelante.
  - Función `createReport(input)` y `checkReportQuota(userId)` como firmas documentadas, sin ruta API que las use (`// NOT IMPLEMENTED (MVP)`).
  - Documenta en README y DECISIONS.md cómo se enchufaría la implementación real: un `AnthropicClassifier` con el SDK oficial, salida estructurada validada con el mismo esquema Zod, modelo configurable por variable de entorno (default claude-haiku-5-5), sin herramientas, solo el texto del reporte como entrada, y respaldo a "sin clasificar" si no hay API key o falla la llamada. Deja `ANTHROPIC_API_KEY` y `ANTHROPIC_MODEL` solo como comentario en `.env.example`.
- Límite diario de reportes: regla de producción de máximo 2 reportes por usuario por día, validada en servidor con mensaje claro. En el MVP no se aplica ni se prueba. `checkReportQuota(userId)` siempre permite (`// NOT IMPLEMENTED (MVP)`) y queda llamada desde `createReport`. Documenta en el README y DECISIONS.md la regla final, cómo implementarla (contar reportes del usuario en el día, en zona horaria de Chile; excluir los anónimos exige guardar un contador aparte o un hash del id, porque el reporte anónimo no guarda userId) y que, con sesión por dispositivo, borrar cookies la evade, por lo que depende de la auth real.
- Cola de envíos: interfaz `PushQueue` (`enqueue`, `status`). En el MVP, `InlineQueue` envía directo con los topes descritos. El modelo `NotificationJob` (userId, newsId, status, attempts, nextAttemptAt, lastError) ya está en el esquema y se usa para registrar pendientes. Sin worker, sin Redis, sin BullMQ. En la documentación explica cómo se enchufaría una implementación real (BullMQ en un servidor, o un servicio serverless de colas) sin tocar el resto del código.
- Digest programado: ruta `/api/cron/digest` protegida con secreto y handler vacío documentado. No declararla en vercel.json (en Hobby el cron es como máximo una vez al día).
- Recomendador: interfaz `Recommender.rank(user, news[])`. En el MVP solo coincide por temas. Crear la tabla `Interaction` (impresiones y clics) para ir juntando datos desde ya, sin ML.
- Base de conocimiento, preguntas y respuestas, y bot de WhatsApp: fuera de alcance. Solo asegura que la lógica de dominio viva en `lib/services/*` sin depender de HTTP, para reutilizarla después.

# Prohibido
Redis o BullMQ, SDK de Anthropic o cualquier cliente de LLM, procesos de larga duración, Edge runtime para web-push, features no pedidas, estilos recargados (salvo dentro de `/manual`).

# Entregables
- Repo funcional y `.env.example` completo (DATABASE_URL, claves VAPID, SESSION_SECRET, CRON_SECRET; ANTHROPIC_API_KEY y ANTHROPIC_MODEL solo como comentario para el futuro clasificador; ADMIN_EMAILS y proveedor de correo solo como comentario, para la futura auth).
- README con:
  - cómo correr en local y generar las claves VAPID,
  - cómo desplegar en Vercel con Neon,
  - cómo probar push en un iPhone real (iOS 16.4 o superior, app agregada a la pantalla de inicio),
  - tabla "Incluido en MVP vs Diseñado sin implementar",
  - sección "Decisiones tomadas",
  - sección "Limitaciones de Hobby" (función de 10 s por defecto y 60 s máximo, cron una vez al día, uso no comercial).
- Tests mínimos: selección de destinatarios por tema, limpieza de suscripciones 410, validación del esquema Zod `ReportClassification` (acepta un JSON válido y rechaza gravedad fuera de rango o campos faltantes, sin llamar a ningún LLM), y tests de humo de las vistas mock (ver ampliación).

# Ampliación: vistas mock (solo visual)

Agrega las siguientes vistas como MAQUETAS, construyendo sobre la app base. Las pantallas reales (noticias, preferencias, admin de noticias y entregas push) siguen funcionando como se describió arriba; esta ampliación no cambia su comportamiento. La vista "Reportes" se construye en el hito 4 y el resto en el hito 6, todas bajo estas mismas reglas.

## Reglas generales
- Ninguna vista tiene conexión real: sin backend, sin rutas /api nuevas, sin tablas Prisma nuevas, sin llamadas externas.
- Todos los datos salen de `lib/mocks/*.ts`, tipados con interfaces en `lib/types/*.ts` diseñadas para convertirse después en modelos de base de datos.
- El estado de interfaz vive en memoria (useState o context) y se pierde al recargar.
- Cada vista muestra una etiqueta discreta "Maqueta" y está marcada en el código con `// NOT IMPLEMENTED (MVP)`. El README las lista como no funcionales.
- Mismo sistema de diseño que el resto de la app. Textos de ejemplo en español de Chile. Nada de datos de personas reales ni imágenes reales: usa SVG y gradientes como placeholders.
- Navegación móvil: barra inferior con Inicio (noticias), Calendario, Logros, CAiPuntos y "Más" (menú con Manual novato, Galería, Préstamos, Pagos, Reportes y Preferencias).
- Accesibilidad: foco visible, contraste adecuado, áreas táctiles de al menos 44 px, y respeto de `prefers-reduced-motion` en todas las animaciones.
- Rendimiento: carga diferida (dynamic import) de las vistas pesadas, especialmente el manual.

## Vistas

1. **Calendario de actividades** (`/calendario`)
   - Vista mensual y lista de próximos eventos, con filtros por tipo (carrete, académico, alianza, taller).
   - Detalle de evento: fecha, lugar, cupos y puntos que otorga.
   - Botón "Suscribirme al calendario (.ics)": abre un modal con una URL de ejemplo falsa, botón "Copiar enlace" (solo copia al portapapeles) y pasos ilustrados para Google Calendar, Apple y Outlook. No se genera ni se sirve ningún archivo .ics.
   - Inscripción a evento en un solo flujo corto: campos prellenados con datos mock del perfil (nombre, correo @uc.cl, generación, carrera), más campos extra configurables por evento (por ejemplo restricciones alimentarias, opcional). Al enviar, solo cambia el estado de la interfaz, con pantalla de confirmación animada y botón visual "Agregar a mi calendario". No se guarda nada.

2. **Logros / bucket list** (`/logros`)
   - Tarjetas de misiones por categoría, barra de progreso global, estados bloqueado y completado, insignias.
   - Ejemplos con humor local, como "Ir al baño del 5to piso de las K", "Estudiar una noche entera en la biblioteca", "Ir a tu primer carrete del CAi".
   - Botón "Marcar como cumplido" que solo cambia el estado local, con espacio visual para una foto de evidencia (placeholder).
   - Los retos de ejemplo deben ser seguros: nada que implique riesgo, daño a instalaciones o acceso a zonas restringidas.

3. **Pasarela de pagos** (`/pagos`)
   - Flujo para cuotas, entradas y merch: selección de ítem, resumen, pantalla de método de pago, confirmación.
   - Banner permanente "DEMO: no se procesan pagos".
   - Sin campos de entrada de datos de tarjeta: usa elementos estáticos o deshabilitados con valores de ejemplo.
   - Diseño genérico propio, sin logos ni marcas de procesadores de pago ni de bancos.
   - El comprobante final dice "Comprobante de demostración, sin validez".

4. **Manual novato digital** (`/manual`)
   - Pantalla inmersiva de pantalla completa con capítulos que se deslizan (scroll-snap vertical u horizontal), con mucha animación: parallax, revelado de elementos, transiciones entre capítulos, indicador de progreso, ilustraciones SVG placeholder.
   - Capítulos de ejemplo: Bienvenida, Cómo se organiza la escuela, Sobrevivir el primer semestre, Dónde comer y estudiar, Quién es quién, Carretes y comunidad, Qué hacer si algo sale mal.
   - Los párrafos son placeholders ("Texto de ejemplo, contenido pendiente").
   - Debe verse fluido en un teléfono de gama media: animar solo `transform` y `opacity`.

5. **CAiPuntos** (`/puntos`)
   - Saldo, nivel con barra de progreso, historial de movimientos, catálogo de recompensas con "Canjear" (modal con confetti, solo visual).
   - Ranking opcional con apodos ficticios.

6. **Galería** (`/galeria`)
   - Álbumes de alianzas y carretes, grilla tipo masonry, filtros por álbum, visor tipo lightbox con swipe. Todo con placeholders.

7. **Préstamos y solicitudes** (`/prestamos`)
   - Catálogo de ítems (calculadoras, delantal, etc.) con estado: disponible, prestado o reservado.
   - Formulario de solicitud (fechas, retiro) y "Mis solicitudes" con estados pendiente, aprobada y devuelta, todo en memoria.

8. **Reportes** (`/reportes`)
   - Formulario con texto libre, categoría opcional (lista de `lib/mocks/reports.ts`) y selector anónimo o identificado; si es identificado, muestra los datos mock del perfil sin campos editables de correo.
   - Al enviar, solo cambia el estado de la interfaz: pantalla de confirmación con el reporte en estado "Recibido, clasificación pendiente" y una tarjeta con el resultado de clasificación de ejemplo (categoría, lugar, gravedad, resumen) marcada "Ejemplo: la clasificación automática aún no está activa".
   - "Mis reportes": lista en memoria con los enviados en la sesión más algunos de ejemplo, con estados recibido, en revisión y resuelto.
   - Aviso discreto del límite de producción ("máximo 2 reportes por día") sin aplicarlo.
   - Los textos de ejemplo no mencionan personas reales ni lugares con riesgo.

9. **Contenido de cai.cl**
   - No hagas scraping ni copies texto o imágenes del sitio actual. Crea `lib/mocks/cai-content.ts` con la estructura (quiénes somos, representantes, convenios, documentos) llena de placeholders marcados "pendiente de migrar".

## Excepciones a las reglas anteriores
- Se permite UNA librería de animación (Motion) y relajar "estilos recargados" solo dentro de `/manual`. Ninguna otra dependencia nueva.

## Entregables adicionales
- Tests de humo: cada ruta mock renderiza sin errores.
- README: agrega estas vistas a la tabla "Incluido en MVP vs Diseñado sin implementar" como "Solo maqueta", con una línea por vista sobre qué haría falta para volverla real.