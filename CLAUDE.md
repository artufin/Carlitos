# CLAUDE.md

PWA del Centro de Alumnos de Ingeniería UC (CAi). MVP desplegable en Vercel Hobby. Código y comentarios en inglés; textos de UI y documentación en español de Chile.

Documentación de referencia: [README.md](README.md) (cómo correr, desplegar, tabla de qué está implementado) y [docs/DECISIONS.md](docs/DECISIONS.md) (decisiones de diseño). Mantén ambos al día cuando cambies algo de lo que describen.

## Stack

Next.js 16 (App Router, Turbopack, `proxy.ts` en vez de `middleware.ts`) · React 19 · TypeScript estricto · Tailwind 4 + shadcn/ui (sobre `@base-ui/react`, los botones usan `render={<Link/>}`, no `asChild`) · Prisma 6 + PostgreSQL · Zod 4 · `web-push` · Vitest + Testing Library · Motion (solo en vistas mock).

No agregues dependencias nuevas sin preguntar: el proyecto resuelve hash de contraseñas, firmas y cookies con `node:crypto` / Web Crypto.

## Comandos

pnpm no está instalado globalmente en esta máquina: usa `npx -y pnpm@10.34.5 <cmd>` (la versión exacta de `packageManager`; con `pnpm@10` la instalación falla en silencio). No uses `npx prisma` (baja otra versión): usa `node_modules/.bin/prisma`, `node_modules/.bin/tsc`, etc.

```bash
pnpm dev          # http://localhost:3000 (necesita .env con DATABASE_URL y SESSION_SECRET)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest run
pnpm build        # prisma generate && next build
pnpm check        # todo lo anterior
pnpm db:push      # aplica prisma/schema.prisma a la base (no hay migraciones versionadas)
pnpm db:seed      # temas y noticias de ejemplo
```

Variables de entorno en [.env.example](.env.example). **La app necesita PostgreSQL para funcionar** (usuarios, temas, noticias, cuentas). Neon free sirve.

En local el usuario usa su PostgreSQL 18 instalado, base `cai`: `DATABASE_URL` y `DIRECT_URL` = `postgresql://postgres:<su contraseña>@localhost:5432/cai`, **sin** `?sslmode=require` (eso es para Neon). Caracteres especiales de la contraseña van codificados en la URL (`@` → `%40`). Error `P1001 … host:5432` = el `.env` aún tiene los valores de ejemplo. Nunca leas ni muestres el `.env`: tiene su contraseña.

## Problemas conocidos en Windows

- `EPERM: operation not permitted, rename …` en `prisma generate` / `pnpm install`: un proceso `node.exe` (normalmente un `next dev` que quedó vivo) tiene bloqueado el motor de Prisma. Cerrar esos procesos y reintentar. Al terminar pruebas, asegúrate de que ningún `next dev` tuyo quede corriendo (detener la tarea en segundo plano no siempre mata los procesos hijos), y no puedes matar procesos con `Stop-Process` sin permiso: pídeselo al usuario.
- El aviso "Update available! 10.34.5 → 12.x" de pnpm se ignora: el proyecto está fijado a 10.34.5.

## Cómo trabaja el usuario

- Es principiante: explica en español simple, con comandos listos para copiar y paso a paso.
- Corre los comandos en una PowerShell aparte y pega los errores. Si los corre en el panel Terminal de la app, se pueden leer con `read_terminal`.
- Repo: `origin` = https://github.com/artufin/Carlitos (el usuario tiene permiso de escritura). El trabajo de cuentas está en la rama `cuentas`, subida a `origin/cuentas`; `main` sigue como el original hasta que se una (PR o merge). Haz commit y push solo cuando lo pida, nunca directo a `main` ni con `--force`, y verifica antes que `.env` no esté en el commit.

## Estructura

- `app/` rutas. `app/api/*` route handlers con `runtime = "nodejs"`, envueltos en `withErrorHandling` y validando con `parseJsonBody(request, schema)` (`lib/http.ts`). Errores de dominio: lanzar `HttpError(status, mensajeEnEspañol)`.
- `lib/services/*` lógica de dominio; `lib/validation/*` esquemas Zod; `lib/db.ts` cliente Prisma; `lib/env.ts` env parseado con Zod (`getEnv()`).
- `lib/mocks/*` + `lib/types/*` datos de las vistas maqueta (calendario, logros, puntos, pagos, galería, préstamos, reportes, manual). Esas vistas no tocan la base y llevan `// NOT IMPLEMENTED (MVP)` y la etiqueta "Maqueta".
- `components/ui/*` shadcn generado: no lo edites a mano salvo necesidad.
- `tests/` espejo por área. Tests de componentes declaran `// @vitest-environment jsdom`.

## Identidad y cuentas

- `proxy.ts` asegura la cookie firmada `cai_device` en cada petición (no toca la base).
- Cuentas con cualquier correo + contraseña (mín. `PASSWORD_MIN_LENGTH` = 8): `app/api/auth/{register,verify,resend,login,logout,me}`, `lib/auth/auth-service.ts`, `lib/auth/password.ts` (scrypt), `lib/validation/auth.ts` (compartido con el cliente: sin imports de servidor).
- Registro → código de 6 dígitos por correo (`lib/auth/email.ts`: Brevo con `BREVO_API_KEY` + `EMAIL_FROM` = remitente verificado en Brevo, si no Resend con `RESEND_API_KEY`; sin clave en desarrollo se imprime en la consola del servidor como `[auth] código de verificación para …`) → `/api/auth/verify` marca `emailVerifiedAt` e inicia la sesión. Sin verificar no hay sesión.
- Bloqueo de login por correo en `lib/auth/throttle.ts` (tabla `LoginThrottle`): 3 fallos libres, luego 30 s duplicando hasta 15 min; responde 429 con `details.retryAfter`.
- Sesión en la cookie firmada `cai_session` (30 días, `lib/session/cookie.ts`). Se escribe/borra con `startSession` / `endSession` / `rotateDeviceId` de `lib/session/user.ts`, solo desde route handlers.
- **Siempre obtén el usuario con `getCurrentUser()` / `requireUser()`**: devuelve la cuenta si hay sesión y, si no, el usuario anónimo del dispositivo. Para saber si alguien inició sesión, revisa `user.email` (o `getSessionUserId()` si no quieres crear un usuario de dispositivo).
- Pantallas: `/login` (ingresar / crear cuenta, `?modo=registro` abre registro), `/cuenta` (datos y cerrar sesión). El header muestra el nombre vía `GET /api/auth/me` (`components/layout/account-link.tsx`).
- Pendiente: recuperar contraseña, rol admin.

## Advertencias

- `/admin` y `/api/admin/*` están **abiertos**: `requireAdmin()` (`lib/auth/admin.ts`) no verifica nada. Toda página/ruta admin debe llamarlo igual, para que activarlo sea un cambio de un archivo (`user.role !== "ADMIN"` → `AdminForbiddenError`).
- Nunca loguees contraseñas, hashes, endpoints push, claves de suscripción ni textos de reportes. Única excepción: el código de verificación en la consola, solo en desarrollo y sin clave de correo. Nunca pidas ni aceptes que el usuario pegue claves de API en el chat: van solo en su `.env`.
- Next.js 16.4.0 muestra un aviso de vulnerabilidad conocida y detiene `next build` / `next dev` la primera vez; al reintentar continúa. `next dev` también (re)genera `AGENTS.md`.
- Para probar en local sin tocar otra base: hay PostgreSQL 18 instalado en `C:\Program Files\PostgreSQL\18`.
- Push: cada envío debe terminar en una notificación visible (`public/sw.js`), por exigencia de iOS.
- Tras cambiar `prisma/schema.prisma`: `node_modules/.bin/prisma generate` y `pnpm db:push` contra la base (el usuario debe correr `db:push` en su máquina para crear las columnas/tablas nuevas).
