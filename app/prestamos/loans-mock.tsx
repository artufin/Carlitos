"use client";

// NOT IMPLEMENTED (MVP): mock item catalog, request form and "Mis solicitudes".
// All state lives in memory and is lost on reload. No API calls.

import { useId, useRef, useState, type FormEvent } from "react";
import { CheckCircle2Icon, InfoIcon } from "lucide-react";
import { cn } from "cn";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatRelative } from "@/lib/format";
import {
  dateInputValue,
  loanItemStatusLabel,
  loanRequestStatusLabel,
  mockLoanItems,
  mockLoanRequests,
  pickupPlaces,
} from "@/lib/mocks/loans";
import type { LoanItem, LoanItemKind, LoanItemStatus, LoanRequest, LoanRequestStatus } from "@/lib/types/loan";

const ITEM_STATUS_CLASS: Record<LoanItemStatus, string> = {
  available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  borrowed: "bg-muted text-muted-foreground",
  reserved: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

const REQUEST_STATUS_CLASS: Record<LoanRequestStatus, string> = {
  pending: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  returned: "bg-muted text-muted-foreground",
};

/** Local "YYYY-MM-DD" → Date, avoiding the UTC shift of `new Date("YYYY-MM-DD")`. */
function parseDateInput(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function LoansMock() {
  const [items, setItems] = useState<LoanItem[]>(mockLoanItems);
  const [requests, setRequests] = useState<LoanRequest[]>(mockLoanRequests);
  const [itemId, setItemId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [placeId, setPlaceId] = useState(pickupPlaces[0].id);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();

  function pickItem(id: string) {
    setItemId(id);
    setSuccess(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById(`${formId}-pickup`)?.focus({ preventScroll: true });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSuccess(null);
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      setError("Elige un ítem del catálogo.");
      return;
    }
    if (item.status !== "available") {
      setError("Ese ítem no está disponible ahora. Elige otro.");
      return;
    }
    if (!pickupDate || !returnDate) {
      setError("Indica fecha de retiro y de devolución.");
      return;
    }
    if (parseDateInput(returnDate) < parseDateInput(pickupDate)) {
      setError("La devolución no puede ser antes del retiro.");
      return;
    }
    setError(null);
    const request: LoanRequest = {
      id: `req-${Date.now()}`,
      itemId: item.id,
      pickupDate,
      returnDate,
      pickupPlaceId: placeId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setRequests((prev) => [request, ...prev]);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "reserved", dueDate: returnDate } : i)));
    setSuccess(`Solicitud enviada: ${item.name}. Queda pendiente de aprobación (demo, no se guarda).`);
    setItemId("");
    setPickupDate("");
    setReturnDate("");
  }

  function markReturned(id: string) {
    const request = requests.find((r) => r.id === id);
    if (!request) return;
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "returned" } : r)));
    setItems((prev) => prev.map((i) => (i.id === request.itemId ? { ...i, status: "available", dueDate: null } : i)));
  }

  const today = dateInputValue(0);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 font-heading text-lg font-semibold">Catálogo</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col rounded-xl bg-card p-3 text-sm ring-1 ring-foreground/10">
              <ItemIllustration kind={item.kind} />
              <div className="mt-2 flex-1 space-y-1">
                <span className={cn("inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium", ITEM_STATUS_CLASS[item.status])}>
                  {loanItemStatusLabel[item.status]}
                </span>
                <p className="leading-snug font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {item.dueDate && item.status !== "available" && (
                  <p className="text-xs text-muted-foreground">Vuelve el {formatDate(parseDateInput(item.dueDate))}</p>
                )}
              </div>
              <Button
                type="button"
                variant={item.status === "available" ? "default" : "outline"}
                className="mt-3 h-11 w-full"
                disabled={item.status !== "available"}
                onClick={() => pickItem(item.id)}
                aria-label={`Solicitar ${item.name}`}
              >
                {item.status === "available" ? "Solicitar" : "No disponible"}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-heading text-lg font-semibold">Nueva solicitud</h2>
        <form ref={formRef} onSubmit={onSubmit} className="scroll-mt-20 space-y-4 rounded-xl border p-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-item`}>Ítem</Label>
            <NativeSelect
              id={`${formId}-item`}
              className="h-11"
              value={itemId}
              onChange={(e) => {
                setItemId(e.target.value);
                setSuccess(null);
              }}
            >
              <option value="">Elige un ítem</option>
              {items.map((item) => (
                <option key={item.id} value={item.id} disabled={item.status !== "available"}>
                  {item.name}
                  {item.status !== "available" ? ` (${loanItemStatusLabel[item.status].toLowerCase()})` : ""}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-pickup`}>Fecha de retiro</Label>
              <Input
                id={`${formId}-pickup`}
                type="date"
                className="h-11"
                min={today}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${formId}-return`}>Fecha de devolución</Label>
              <Input
                id={`${formId}-return`}
                type="date"
                className="h-11"
                min={pickupDate || today}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-place`}>Lugar de retiro</Label>
            <NativeSelect id={`${formId}-place`} className="h-11" value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
              {pickupPlaces.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.label}
                </option>
              ))}
            </NativeSelect>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              {success}
            </p>
          )}

          <Button type="submit" className="h-11 w-full sm:w-auto">
            Enviar solicitud
          </Button>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            El CAi revisa las solicitudes en horario de oficina. Trae tu credencial al retirar.
          </p>
        </form>
      </section>

      <section>
        <h2 className="mb-2 font-heading text-lg font-semibold">Mis solicitudes</h2>
        <ul className="divide-y rounded-xl border text-sm">
          {requests.map((request) => {
            const item = items.find((i) => i.id === request.itemId);
            const place = pickupPlaces.find((p) => p.id === request.pickupPlaceId);
            return (
              <li key={request.id} className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", REQUEST_STATUS_CLASS[request.status])}>
                    {loanRequestStatusLabel[request.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatRelative(request.createdAt)}</span>
                </div>
                <p className="font-medium">{item?.name ?? "Ítem"}</p>
                <p className="text-xs text-muted-foreground">
                  Retiro {formatDate(parseDateInput(request.pickupDate))} · Devolución {formatDate(parseDateInput(request.returnDate))} ·{" "}
                  {place?.label ?? "Lugar por definir"}
                </p>
                {request.status === "approved" && (
                  <Button type="button" variant="outline" className="h-11" onClick={() => markReturned(request.id)}>
                    Marcar devuelta
                  </Button>
                )}
              </li>
            );
          })}
          {requests.length === 0 && <li className="p-6 text-center text-muted-foreground">Todavía no has hecho solicitudes.</li>}
        </ul>
      </section>
    </div>
  );
}

/** Placeholder illustration per item kind: simple shapes on a gradient, no real images. */
function ItemIllustration({ kind }: { kind: LoanItemKind }) {
  const gradientId = `loan-grad-${kind}`;
  return (
    <svg viewBox="0 0 96 64" className="h-20 w-full rounded-lg" role="img" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-muted)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <rect width="96" height="64" fill={`url(#${gradientId})`} />
      <g fill="none" stroke="var(--color-foreground)" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {kind === "calculator" && (
          <>
            <rect x="34" y="10" width="28" height="44" rx="4" />
            <rect x="39" y="15" width="18" height="9" rx="1.5" fill="var(--color-foreground)" fillOpacity="0.15" />
            <path d="M40 31h3M46 31h3M52 31h3M40 38h3M46 38h3M52 38h3M40 45h3M46 45h3M52 45h3" />
          </>
        )}
        {kind === "apron" && (
          <>
            <path d="M38 10h20v12l8 6v26H30V28l8-6z" />
            <path d="M38 10c0 6 20 6 20 0M30 28h36" />
          </>
        )}
        {kind === "padlock" && (
          <>
            <rect x="34" y="30" width="28" height="24" rx="4" fill="var(--color-foreground)" fillOpacity="0.1" />
            <path d="M39 30v-8a9 9 0 0 1 18 0v8" />
            <circle cx="48" cy="41" r="2.5" fill="var(--color-foreground)" fillOpacity="0.5" />
            <path d="M48 43v5" />
          </>
        )}
        {kind === "charger" && (
          <>
            <rect x="36" y="22" width="24" height="24" rx="5" fill="var(--color-foreground)" fillOpacity="0.1" />
            <path d="M43 22v-8M53 22v-8M48 46v10" />
          </>
        )}
        {kind === "adapter" && (
          <>
            <rect x="30" y="24" width="20" height="16" rx="3" fill="var(--color-foreground)" fillOpacity="0.1" />
            <path d="M50 32h8M58 26h12v12H58zM30 32h-8" />
          </>
        )}
        {kind === "kit" && (
          <>
            <path d="M28 50L58 20l10 10-30 30z" fill="var(--color-foreground)" fillOpacity="0.08" />
            <path d="M34 44l4 4M40 38l4 4M46 32l4 4M52 26l4 4" />
            <path d="M22 16l14 0M29 16v24" />
          </>
        )}
      </g>
    </svg>
  );
}
