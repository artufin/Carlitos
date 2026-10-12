"use client";

import { useEffect, useState } from "react";
import { BellIcon, BellOffIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getExistingSubscription,
  isIos,
  isPushSupported,
  isStandalone,
  saveSubscriptionOnServer,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

type State = "loading" | "unsupported" | "ios-not-installed" | "denied" | "off" | "on" | "busy";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function EnablePushButton({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      if (!isPushSupported()) {
        setState(isIos() && !isStandalone() ? "ios-not-installed" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      const existing = await getExistingSubscription();
      if (!cancelled) setState(existing ? "on" : "off");
    }
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setError(null);
    if (!VAPID_PUBLIC_KEY) {
      setError("El servidor no tiene configuradas las claves de push.");
      return;
    }
    setState("busy");
    try {
      // The permission prompt is only requested here, after a user tap.
      const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
      await saveSubscriptionOnServer(subscription);
      setState("on");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "permission-denied") {
        setState("denied");
      } else {
        setState("off");
        setError("No pudimos activar los avisos. Inténtalo de nuevo.");
      }
    }
  }

  async function disable() {
    setError(null);
    setState("busy");
    try {
      await unsubscribeFromPush();
    } finally {
      setState("off");
    }
  }

  if (state === "loading") return null;

  if (state === "unsupported") {
    return <p className="text-sm text-muted-foreground">Este navegador no soporta notificaciones push.</p>;
  }

  if (state === "ios-not-installed") {
    return (
      <p className="text-sm text-muted-foreground">
        En iPhone, primero agrega la app a la pantalla de inicio (Compartir → “Agregar a pantalla de inicio”) y ábrela desde ahí para
        activar los avisos.
      </p>
    );
  }

  if (state === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Los avisos están bloqueados en este navegador. Puedes habilitarlos desde la configuración del sitio.
      </p>
    );
  }

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
      {state === "on" ? (
        <>
          {!compact && (
            <p className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckIcon className="size-4" aria-hidden /> Avisos activados en este dispositivo.
            </p>
          )}
          <Button type="button" variant="outline" className="h-11" onClick={disable}>
            <BellOffIcon aria-hidden />
            Desactivar avisos
          </Button>
        </>
      ) : (
        <Button type="button" className="h-11" onClick={enable} disabled={state === "busy"}>
          <BellIcon aria-hidden />
          {state === "busy" ? "Activando…" : "Activar avisos"}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
