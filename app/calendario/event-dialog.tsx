"use client";

// NOT IMPLEMENTED (MVP): event detail + sign-up flow inside a dialog.
// Submitting only updates in-memory state and shows an animated confirmation.

import { useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CalendarPlusIcon, CheckIcon, ClockIcon, MapPinIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EventTypeBadge } from "@/app/calendario/event-type-badge";
import { formatTime, formatTimeRange } from "@/app/calendario/event-utils";
import { formatDate } from "@/lib/format";
import { mockProfile } from "@/lib/mocks/profile";
import type { CalendarEvent, EventRegistration } from "@/lib/types/calendar";

type Stage = "detail" | "form" | "done";

export function EventDialog({
  event,
  registration,
  onRegister,
  onClose,
}: {
  event: CalendarEvent | null;
  registration: EventRegistration | null;
  onRegister: (registration: EventRegistration) => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("detail");

  return (
    <Dialog open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {event && stage === "done" && registration ? (
          <Confirmation event={event} onClose={onClose} />
        ) : event ? (
          <>
            <DialogHeader>
              <EventTypeBadge type={event.type} className="w-fit" />
              <DialogTitle className="leading-snug">{event.title}</DialogTitle>
              <DialogDescription>{event.description}</DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <ClockIcon className="size-4" aria-hidden /> Cuándo
              </dt>
              <dd>
                {formatDate(event.startsAt)} · {formatTimeRange(event)}
              </dd>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <MapPinIcon className="size-4" aria-hidden /> Dónde
              </dt>
              <dd>{event.place}</dd>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <UsersIcon className="size-4" aria-hidden /> Cupos
              </dt>
              <dd>
                {event.capacity - event.registered > 0
                  ? `${event.capacity - event.registered} disponibles de ${event.capacity}`
                  : `Sin cupos (${event.capacity} inscritos)`}
              </dd>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <SparklesIcon className="size-4" aria-hidden /> Otorga
              </dt>
              <dd>{event.points} CAiPuntos</dd>
            </dl>

            {stage === "form" ? (
              <SignUpForm
                event={event}
                onSubmit={(reg) => {
                  onRegister(reg);
                  setStage("done");
                }}
                onCancel={() => setStage("detail")}
              />
            ) : registration ? (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                <p className="flex items-center gap-2 font-medium">
                  <CheckIcon className="size-4" aria-hidden /> Ya estás inscrito en este evento
                </p>
                <p className="mt-1 text-xs opacity-80">Con el correo {registration.email}.</p>
              </div>
            ) : (
              <Button
                type="button"
                className="h-11 w-full"
                disabled={event.capacity - event.registered <= 0}
                onClick={() => setStage("form")}
              >
                {event.capacity - event.registered > 0 ? "Inscribirme" : "Sin cupos"}
              </Button>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SignUpForm({
  event,
  onSubmit,
  onCancel,
}: {
  event: CalendarEvent;
  onSubmit: (registration: EventRegistration) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(mockProfile.name);
  const [email, setEmail] = useState(mockProfile.email);
  const [generation, setGeneration] = useState(String(mockProfile.generation));
  const [major, setMajor] = useState(mockProfile.major);
  const [extra, setExtra] = useState<Record<string, string>>(() =>
    Object.fromEntries(event.extraFields.map((f) => [f.id, ""])),
  );
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Nombre y correo son obligatorios.");
      return;
    }
    if (!/^[^\s@]+@uc\.cl$/i.test(email.trim())) {
      setError("Usa tu correo @uc.cl.");
      return;
    }
    const missing = event.extraFields.find((f) => f.required && !extra[f.id]?.trim());
    if (missing) {
      setError(`Falta responder: ${missing.label}.`);
      return;
    }
    setError(null);
    onSubmit({
      id: `reg-${Date.now()}`,
      eventId: event.id,
      name: name.trim(),
      email: email.trim(),
      generation: Number(generation) || mockProfile.generation,
      major: major.trim(),
      extra,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t pt-3" noValidate>
      <p className="text-xs text-muted-foreground">Prellenamos tus datos del perfil. Puedes corregirlos antes de confirmar.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Nombre</Label>
          <Input id="signup-name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Correo UC</Label>
          <Input id="signup-email" className="h-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-generation">Generación</Label>
          <Input
            id="signup-generation"
            className="h-11"
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-major">Carrera</Label>
          <Input id="signup-major" className="h-11" value={major} onChange={(e) => setMajor(e.target.value)} />
        </div>
      </div>

      {event.extraFields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label htmlFor={`signup-extra-${field.id}`}>
            {field.label}
            {!field.required && <span className="font-normal text-muted-foreground">(opcional)</span>}
          </Label>
          {field.type === "select" ? (
            <NativeSelect
              id={`signup-extra-${field.id}`}
              className="h-11"
              value={extra[field.id] ?? ""}
              onChange={(e) => setExtra((prev) => ({ ...prev, [field.id]: e.target.value }))}
            >
              <option value="">Elige una opción</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          ) : (
            <Input
              id={`signup-extra-${field.id}`}
              className="h-11"
              placeholder={field.placeholder}
              value={extra[field.id] ?? ""}
              onChange={(e) => setExtra((prev) => ({ ...prev, [field.id]: e.target.value }))}
            />
          )}
        </div>
      ))}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>
          Volver
        </Button>
        <Button type="submit" className="h-11">
          Confirmar inscripción
        </Button>
      </div>
    </form>
  );
}

function Confirmation({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const [added, setAdded] = useState(false);
  const fade = reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-4 py-2 text-center">
      <motion.div
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        aria-hidden
      >
        <CheckIcon className="size-8" />
      </motion.div>
      <motion.div {...fade} transition={{ delay: 0.15, duration: 0.25 }}>
        <DialogTitle className="text-lg">Inscripción confirmada</DialogTitle>
        <DialogDescription className="mt-1">
          Te esperamos en <span className="font-medium text-foreground">{event.title}</span> el {formatDate(event.startsAt)} a las{" "}
          {formatTime(event.startsAt)}.
        </DialogDescription>
        <p className="mt-2 text-xs text-muted-foreground">
          Ganarás {event.points} CAiPuntos al asistir. Demo: nada se guardó en el servidor.
        </p>
      </motion.div>
      <motion.div {...fade} transition={{ delay: 0.3, duration: 0.25 }} className="space-y-2">
        <Button type="button" variant="outline" className="h-11 w-full" onClick={() => setAdded(true)} disabled={added}>
          <CalendarPlusIcon aria-hidden />
          {added ? "Agregado (demo)" : "Agregar a mi calendario"}
        </Button>
        {added && (
          <p role="status" className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Listo. En la versión real se descargaría el evento a tu calendario; aquí es solo visual.
          </p>
        )}
        <Button type="button" className="h-11 w-full" onClick={onClose}>
          Volver al calendario
        </Button>
      </motion.div>
    </div>
  );
}
