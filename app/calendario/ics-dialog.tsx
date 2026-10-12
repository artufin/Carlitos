"use client";

// NOT IMPLEMENTED (MVP): fake ".ics" subscription dialog. The URL is an
// example, nothing is generated or served; "Copiar enlace" only writes the
// text to the clipboard.

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockIcsUrl } from "@/lib/mocks/calendar";

const GUIDES: { id: string; name: string; accent: string; steps: string[] }[] = [
  {
    id: "google",
    name: "Google Calendar",
    accent: "text-sky-600 dark:text-sky-300",
    steps: [
      "Abre Google Calendar en el computador.",
      "En \"Otros calendarios\" toca el \"+\" y elige \"Desde URL\".",
      "Pega el enlace y confirma con \"Agregar calendario\".",
    ],
  },
  {
    id: "apple",
    name: "Apple Calendar",
    accent: "text-rose-600 dark:text-rose-300",
    steps: [
      "En iPhone: Ajustes → Calendario → Cuentas → Añadir cuenta → Otra.",
      "Elige \"Añadir calendario suscrito\".",
      "Pega el enlace y toca \"Siguiente\" y luego \"Guardar\".",
    ],
  },
  {
    id: "outlook",
    name: "Outlook",
    accent: "text-indigo-600 dark:text-indigo-300",
    steps: [
      "Abre Outlook en la web y entra a Calendario.",
      "Toca \"Agregar calendario\" → \"Suscribirse desde la web\".",
      "Pega el enlace, ponle un nombre y guarda.",
    ],
  },
];

/** Generic calendar glyph (no brand logos). */
function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="7" width="24" height="21" rx="4" />
      <path d="M4 13h24M11 4v6M21 4v6" />
      <circle cx="11" cy="19" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="19" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="21" cy="19" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="11" cy="24" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="24" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IcsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(mockIcsUrl);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setCopyState("idle");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suscribirme al calendario</DialogTitle>
          <DialogDescription>
            Pega este enlace en tu app de calendario y los eventos del CAi se actualizarán solos. Demo: la URL es de ejemplo y no sirve
            ningún archivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="ics-url">Enlace de suscripción</Label>
          <div className="flex gap-2">
            <Input id="ics-url" className="h-11 font-mono text-xs" value={mockIcsUrl} readOnly onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" className="h-11 shrink-0" onClick={copy}>
              {copyState === "copied" ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
              {copyState === "copied" ? "Copiado" : "Copiar enlace"}
            </Button>
          </div>
          <p role="status" className="min-h-4 text-xs text-muted-foreground">
            {copyState === "copied" && "Enlace copiado al portapapeles."}
            {copyState === "error" && "No se pudo copiar. Selecciona el texto y cópialo a mano."}
          </p>
        </div>

        <div className="space-y-3">
          {GUIDES.map((guide) => (
            <section key={guide.id} className="rounded-lg border p-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <CalendarGlyph className={`size-5 ${guide.accent}`} />
                {guide.name}
              </h3>
              <ol className="mt-2 space-y-1.5 text-sm">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">
                      <span className="sr-only">Paso {i + 1}: </span>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
