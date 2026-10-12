"use client";

import { useSyncExternalStore } from "react";
import { ShareIcon, SquarePlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isIos, isStandalone } from "@/lib/push-client";

const DISMISS_KEY = "cai.ios-install-banner.dismissed";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function getSnapshot(): boolean {
  return isIos() && !isStandalone() && !isDismissed();
}

function getServerSnapshot(): boolean {
  return false;
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // ignore: banner will come back next visit
  }
  listeners.forEach((l) => l());
}

/** Shown only on iOS Safari when the app is not installed to the Home Screen. */
export function IosInstallBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!visible) return null;

  return (
    <aside role="note" className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
      <div className="flex-1">
        <p className="font-medium">Instala la app para recibir avisos</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-muted-foreground">
          <li>
            Toca <ShareIcon className="inline size-4 align-text-bottom" aria-label="Compartir" /> Compartir en Safari.
          </li>
          <li>
            Elige <SquarePlusIcon className="inline size-4 align-text-bottom" aria-hidden /> “Agregar a pantalla de inicio”.
          </li>
          <li>Abre CAi desde la pantalla de inicio y activa los avisos.</li>
        </ol>
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={dismiss}>
        <XIcon />
      </Button>
    </aside>
  );
}
