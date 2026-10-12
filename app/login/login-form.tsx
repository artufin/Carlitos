"use client";

// NOT IMPLEMENTED (MVP)
// Final UI for the email + one-time code login. It does not validate, does not
// send any email and "Continuar" simply navigates to the feed. The real flow
// will call AuthService.requestCode / verifyCode (lib/auth/auth-service.ts).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeftIcon, MailIcon, ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth/auth-service";

type Step = "email" | "code";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  function onEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setStep("code");
  }

  function onCodeSubmit(event: FormEvent) {
    event.preventDefault();
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div aria-hidden className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          CAi
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Ingresa con tu correo UC</h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un código de un solo uso a tu correo @{ALLOWED_EMAIL_DOMAIN}.
        </p>
      </div>

      <p
        role="status"
        className="rounded-lg border border-dashed border-amber-500/60 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      >
        Demo: el inicio de sesión aún no está activo
      </p>

      {step === "email" ? (
        <form onSubmit={onEmailSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Correo UC</Label>
            <div className="relative">
              <MailIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={`nombre@${ALLOWED_EMAIL_DOMAIN}`}
                className="h-11 pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="h-11 w-full">
            Enviarme el código
          </Button>
        </form>
      ) : (
        <form onSubmit={onCodeSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="code">Código de 6 dígitos</Label>
            <div className="relative">
              <ShieldCheckIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
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
            <p className="text-xs text-muted-foreground">
              Enviado a <span className="font-medium text-foreground">{email || `nombre@${ALLOWED_EMAIL_DOMAIN}`}</span>.
              Revisa también la carpeta de spam.
            </p>
          </div>
          <Button type="submit" className="h-11 w-full">
            Continuar
          </Button>
          <Button type="button" variant="ghost" className="h-11 w-full" onClick={() => setStep("email")}>
            <ArrowLeftIcon aria-hidden />
            Cambiar correo
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4 hover:text-foreground">
          Seguir sin ingresar
        </Link>
      </p>
    </div>
  );
}
