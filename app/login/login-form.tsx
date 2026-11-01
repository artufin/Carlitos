"use client";

// Email + password login and registration, plus the step where the user types
// the 6-digit code we emailed. Talks to /api/auth/{login,register,verify,resend};
// the server sets the httpOnly session cookie once the email is verified.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeftIcon, LockIcon, MailIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

type Mode = "login" | "register";

interface ApiBody {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
    retryAfter?: number;
    verificationRequired?: boolean;
  };
  retryAfter?: number;
}

/** First field-level message from a Zod `flatten()`, falling back to the generic error. */
function errorMessage(body: ApiBody): string {
  const fieldErrors = body.details?.fieldErrors ?? {};
  const first = Object.values(fieldErrors).find((messages) => messages && messages.length > 0);
  return first?.[0] ?? body.error ?? "No pudimos completar la solicitud";
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

/** Seconds remaining until `until` (epoch ms), ticking every second. */
function useCountdown(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

async function post(url: string, payload: unknown): Promise<{ ok: boolean; status: number; body: ApiBody }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: response.ok, status: response.status, body: (await response.json().catch(() => ({}))) as ApiBody };
}

const iconClass = "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground";

export function LoginForm({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [verifying, setVerifying] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);

  const lockSeconds = useCountdown(lockedUntil);
  const resendSeconds = useCountdown(resendAt);
  const isRegister = mode === "register";

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  function goToVerify() {
    setVerifying(true);
    setCode("");
    setError(null);
    setNotice(`Te enviamos un código de 6 dígitos a ${email.trim()}.`);
    setResendAt(Date.now() + 60_000);
  }

  function finish() {
    router.push("/");
    router.refresh();
  }

  async function run(action: () => Promise<void>) {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch {
      setError("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  function onCredentialsSubmit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      if (isRegister && password.length < PASSWORD_MIN_LENGTH) {
        setError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
        return;
      }
      const { ok, status, body } = isRegister
        ? await post("/api/auth/register", { name, email, password })
        : await post("/api/auth/login", { email, password });
      if (ok) {
        if (isRegister) goToVerify();
        else finish();
        return;
      }
      if (status === 403 && body.details?.verificationRequired) {
        goToVerify();
        return;
      }
      if (body.details?.retryAfter) setLockedUntil(Date.now() + body.details.retryAfter * 1000);
      setError(errorMessage(body));
    });
  }

  function onCodeSubmit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const { ok, body } = await post("/api/auth/verify", { email, code });
      if (ok) finish();
      else setError(errorMessage(body));
    });
  }

  function onResend() {
    void run(async () => {
      const { ok, body } = await post("/api/auth/resend", { email });
      if (!ok) {
        setError(errorMessage(body));
        return;
      }
      setResendAt(Date.now() + (body.retryAfter ?? 60) * 1000);
      setNotice(`Si hay una cuenta pendiente para ${email.trim()}, te enviamos un código nuevo.`);
    });
  }

  if (verifying) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div aria-hidden className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-7" />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Verifica tu correo</h1>
          {notice && <p className="text-sm text-muted-foreground">{notice} Revisa también la carpeta de spam.</p>}
        </div>

        <form onSubmit={onCodeSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="code">Código de 6 dígitos</Label>
            <div className="relative">
              <ShieldCheckIcon aria-hidden className={iconClass} />
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                className="h-11 pl-9 tracking-[0.3em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-11 w-full" disabled={pending || code.length !== 6}>
            {pending ? "Verificando…" : "Verificar y entrar"}
          </Button>
          <Button type="button" variant="outline" className="h-11 w-full" onClick={onResend} disabled={pending || resendSeconds > 0}>
            {resendSeconds > 0 ? `Reenviar código en ${formatWait(resendSeconds)}` : "Reenviar código"}
          </Button>
          <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => setVerifying(false)}>
            <ArrowLeftIcon aria-hidden />
            Volver
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div aria-hidden className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          CAi
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {isRegister ? "Crea tu cuenta" : "Ingresa a tu cuenta"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRegister ? "Te enviaremos un código para confirmar tu correo." : "Con tu correo y contraseña."}
        </p>
      </div>

      <div role="tablist" aria-label="Tipo de acceso" className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-medium">
        {(
          [
            ["login", "Ingresar"],
            ["register", "Crear cuenta"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={
              mode === value
                ? "rounded-md bg-background px-3 py-2 shadow-sm"
                : "rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onCredentialsSubmit} className="space-y-4" noValidate>
        {isRegister && (
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <div className="relative">
              <UserIcon aria-hidden className={iconClass} />
              <Input
                id="name"
                autoComplete="name"
                placeholder="Tu nombre"
                className="h-11 pl-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <div className="relative">
            <MailIcon aria-hidden className={iconClass} />
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nombre@correo.com"
              className="h-11 pl-9"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLockedUntil(null); // the lockout is per email
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <LockIcon aria-hidden className={iconClass} />
            <Input
              id="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? `Mínimo ${PASSWORD_MIN_LENGTH} caracteres` : "Tu contraseña"}
              className="h-11 pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <ErrorBox message={lockSeconds > 0 ? `${error} (${formatWait(lockSeconds)})` : error} />}

        <Button type="submit" className="h-11 w-full" disabled={pending || (!isRegister && lockSeconds > 0)}>
          {pending
            ? "Un momento…"
            : isRegister
              ? "Crear cuenta"
              : lockSeconds > 0
                ? `Espera ${formatWait(lockSeconds)}`
                : "Ingresar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4 hover:text-foreground">
          Seguir sin ingresar
        </Link>
      </p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
