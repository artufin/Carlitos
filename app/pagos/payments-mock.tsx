"use client";

// NOT IMPLEMENTED (MVP): mock payment flow (item -> summary -> method -> receipt).
// All state lives in memory and is lost on reload. There are no editable card
// fields: the payment screen only shows static or disabled example values.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  CreditCardIcon,
  LandmarkIcon,
  LockIcon,
  MinusIcon,
  PlusIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCLP, formatDateTime } from "@/lib/format";
import {
  createDemoOrder,
  exampleCard,
  exampleTransfer,
  paymentItemById,
  paymentItems,
  paymentKindLabel,
  paymentKindOrder,
  paymentMethodLabel,
  paymentMethods,
} from "@/lib/mocks/payments";
import type { MockOrder, PaymentItem, PaymentMethodId, PaymentStep } from "@/lib/types/payment";

const STEPS: { id: PaymentStep; label: string }[] = [
  { id: "item", label: "Ítem" },
  { id: "summary", label: "Resumen" },
  { id: "method", label: "Pago" },
  { id: "receipt", label: "Listo" },
];

const STEP_TITLE: Record<PaymentStep, string> = {
  item: "¿Qué quieres pagar?",
  summary: "Resumen de tu compra",
  method: "Método de pago",
  receipt: "Pago de demostración completado",
};

const FOCUS_RING = "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function PaymentsMock() {
  const [step, setStep] = useState<PaymentStep>("item");
  const [itemId, setItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethodId>("card");
  const [order, setOrder] = useState<MockOrder | null>(null);
  const reduced = useReducedMotion();

  // Move focus to the step heading when the step changes (not on first render).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusedStep = useRef<PaymentStep>("item");
  useEffect(() => {
    if (focusedStep.current !== step) {
      focusedStep.current = step;
      headingRef.current?.focus();
    }
  }, [step]);

  const item = itemId ? (paymentItemById(itemId) ?? null) : null;
  const total = item ? item.priceCLP * quantity : 0;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function chooseItem(next: PaymentItem) {
    setItemId(next.id);
    setQuantity(1);
    setStep("summary");
  }

  function pay() {
    if (!item) return;
    setOrder(createDemoOrder(item, quantity, method));
    setStep("receipt");
  }

  function reset() {
    setOrder(null);
    setItemId(null);
    setQuantity(1);
    setMethod("card");
    setStep("item");
  }

  return (
    <div className="space-y-4">
      <div
        role="status"
        className="sticky top-16 z-20 flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 shadow-sm dark:bg-amber-950/60 dark:text-amber-100"
      >
        <ShieldAlertIcon className="size-4 shrink-0" aria-hidden />
        DEMO: no se procesan pagos
      </div>

      <StepIndicator current={stepIndex} />

      <motion.section
        key={step}
        aria-labelledby="payment-step-title"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
        className="space-y-4"
      >
        <h2
          id="payment-step-title"
          ref={headingRef}
          tabIndex={-1}
          className={cn("font-heading text-lg font-semibold rounded-md", FOCUS_RING)}
        >
          {STEP_TITLE[step]}
        </h2>

        {step === "item" && <ItemStep onChoose={chooseItem} />}

        {step === "summary" && item && (
          <SummaryStep
            item={item}
            quantity={quantity}
            total={total}
            onQuantity={setQuantity}
            onBack={() => setStep("item")}
            onNext={() => setStep("method")}
          />
        )}

        {step === "method" && item && (
          <MethodStep method={method} total={total} onMethod={setMethod} onBack={() => setStep("summary")} onPay={pay} />
        )}

        {step === "receipt" && order && <ReceiptStep order={order} onReset={reset} />}
      </motion.section>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol aria-label="Pasos del pago" className="grid grid-cols-4 gap-1">
      {STEPS.map((s, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={s.id}
            aria-current={active ? "step" : undefined}
            className="flex flex-col items-center gap-1 text-center text-xs"
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full border text-xs font-semibold tabular-nums",
                active && "border-primary bg-primary text-primary-foreground",
                done && "border-primary/40 bg-primary/10 text-primary",
                !active && !done && "border-border text-muted-foreground",
              )}
              aria-hidden
            >
              {done ? <CheckIcon className="size-3.5" /> : index + 1}
            </span>
            <span className={cn(active ? "font-medium text-foreground" : "text-muted-foreground")}>
              <span className="sr-only">Paso {index + 1}: </span>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ItemStep({ onChoose }: { onChoose: (item: PaymentItem) => void }) {
  return (
    <div className="space-y-5">
      {paymentKindOrder.map((kind) => (
        <section key={kind} aria-labelledby={`kind-${kind}`}>
          <h3 id={`kind-${kind}`} className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {paymentKindLabel[kind]}
          </h3>
          <ul className="space-y-2">
            {paymentItems
              .filter((i) => i.kind === kind)
              .map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => onChoose(i)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left text-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted/60",
                      FOCUS_RING,
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{i.name}</span>
                      <span className="block text-xs text-muted-foreground">{i.description}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatCLP(i.priceCLP)}</span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SummaryStep({
  item,
  quantity,
  total,
  onQuantity,
  onBack,
  onNext,
}: {
  item: PaymentItem;
  quantity: number;
  total: number;
  onQuantity: (q: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 text-sm ring-1 ring-foreground/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{paymentKindLabel[item.kind]}</p>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
          <p className="shrink-0 font-semibold tabular-nums">{formatCLP(item.priceCLP)}</p>
        </div>

        {item.allowsQuantity && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span id="quantity-label" className="font-medium">
              Cantidad
            </span>
            <div role="group" aria-labelledby="quantity-label" className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11"
                aria-label="Quitar una unidad"
                disabled={quantity <= 1}
                onClick={() => onQuantity(Math.max(1, quantity - 1))}
              >
                <MinusIcon />
              </Button>
              <span aria-live="polite" className="w-10 text-center font-semibold tabular-nums">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11"
                aria-label="Agregar una unidad"
                disabled={quantity >= item.maxQuantity}
                onClick={() => onQuantity(Math.min(item.maxQuantity, quantity + 1))}
              >
                <PlusIcon />
              </Button>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <dl className="space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">
              {quantity} × {formatCLP(item.priceCLP)}
            </dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Comisión (demo)</dt>
            <dd className="tabular-nums">{formatCLP(0)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCLP(total)}</dd>
          </div>
        </dl>
      </div>

      <StepActions onBack={onBack}>
        <Button type="button" className="h-11 flex-1 sm:flex-none" onClick={onNext}>
          Ir a pagar
          <ChevronRightIcon data-icon="inline-end" aria-hidden />
        </Button>
      </StepActions>
    </div>
  );
}

function MethodStep({
  method,
  total,
  onMethod,
  onBack,
  onPay,
}: {
  method: PaymentMethodId;
  total: number;
  onMethod: (m: PaymentMethodId) => void;
  onBack: () => void;
  onPay: () => void;
}) {
  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Elige cómo pagar</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {paymentMethods.map((option) => {
            const Icon = option.id === "card" ? CreditCardIcon : LandmarkIcon;
            const selected = method === option.id;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  selected ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                )}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={option.id}
                  className="sr-only"
                  checked={selected}
                  onChange={() => onMethod(option.id)}
                />
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {method === "card" ? <CardPanel /> : <TransferPanel />}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <LockIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Los campos están deshabilitados: en esta demo no se ingresan ni se envían datos de pago.
      </p>

      <StepActions onBack={onBack}>
        <Button type="button" className="h-11 flex-1 sm:flex-none" onClick={onPay}>
          Pagar {formatCLP(total)} (demo)
        </Button>
      </StepActions>
    </div>
  );
}

/** Generic card illustration drawn with CSS/SVG. No brand, no editable fields. */
function CardPanel() {
  return (
    <div className="space-y-4">
      <div
        aria-label={`Tarjeta de ejemplo terminada en 1234, titular ${exampleCard.holder}`}
        role="img"
        className="relative mx-auto aspect-[1.586] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-5 text-white shadow-md dark:from-slate-700 dark:via-slate-600 dark:to-slate-800"
      >
        <svg aria-hidden className="absolute inset-0 size-full opacity-30" viewBox="0 0 320 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="card-sheen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="270" cy="30" r="90" fill="url(#card-sheen)" />
          <circle cx="40" cy="190" r="70" fill="url(#card-sheen)" />
        </svg>
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="block h-7 w-9 rounded-md bg-amber-200/80" aria-hidden />
            <span className="text-[11px] font-medium tracking-widest text-white/70 uppercase">Tarjeta de ejemplo</span>
          </div>
          <p className="font-mono text-lg tracking-[0.18em] sm:text-xl">{exampleCard.maskedNumber}</p>
          <div className="flex items-end justify-between text-xs">
            <span>
              <span className="block text-[10px] text-white/60 uppercase">Titular</span>
              <span className="font-medium tracking-wide">{exampleCard.holder}</span>
            </span>
            <span>
              <span className="block text-[10px] text-white/60 uppercase">Vence</span>
              <span className="font-medium tabular-nums">{exampleCard.expiry}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DisabledField id="card-holder" label="Nombre en la tarjeta" value={exampleCard.holder} />
        <DisabledField id="card-number" label="Número de tarjeta" value={exampleCard.maskedNumber} mono />
        <DisabledField id="card-expiry" label="Vencimiento" value={exampleCard.expiry} mono />
        <DisabledField id="card-cvv" label="CVV" value={exampleCard.maskedCvv} mono />
      </div>
    </div>
  );
}

/** Fake transfer details, all disabled. "Banco de ejemplo" is not a real bank. */
function TransferPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DisabledField id="tr-bank" label="Banco" value={exampleTransfer.bankLabel} />
      <DisabledField id="tr-type" label="Tipo de cuenta" value={exampleTransfer.accountType} />
      <DisabledField id="tr-number" label="Número de cuenta" value={exampleTransfer.accountNumber} mono />
      <DisabledField id="tr-rut" label="RUT" value={exampleTransfer.rut} mono />
      <DisabledField id="tr-holder" label="Titular" value={exampleTransfer.holder} />
      <DisabledField id="tr-email" label="Correo para comprobante" value={exampleTransfer.email} />
    </div>
  );
}

function DisabledField({ id, label, value, mono = false }: { id: string; label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} disabled readOnly className={cn("h-11", mono && "font-mono")} />
    </div>
  );
}

function ReceiptStep({ order, onReset }: { order: MockOrder; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-200">
          <CheckCircle2Icon className="size-5" aria-hidden />
          Listo, este fue un pago de demostración
        </p>
        <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
          No se cobró nada ni se guardó ningún dato. Así se vería la confirmación en la versión real.
        </p>
      </div>

      <article aria-label="Comprobante de demostración" className="rounded-xl border-2 border-dashed p-4 text-sm">
        <p className="mb-3 rounded-md bg-amber-50 px-2 py-1 text-center text-xs font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-950/40 dark:text-amber-200">
          Comprobante de demostración, sin validez
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">N° de orden</dt>
          <dd className="font-mono">{order.id}</dd>
          <dt className="text-muted-foreground">Fecha</dt>
          <dd>{formatDateTime(order.createdAt)}</dd>
          <dt className="text-muted-foreground">Ítem</dt>
          <dd>{order.itemName}</dd>
          <dt className="text-muted-foreground">Cantidad</dt>
          <dd className="tabular-nums">{order.quantity}</dd>
          <dt className="text-muted-foreground">Método</dt>
          <dd>{paymentMethodLabel[order.method]}</dd>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="text-base font-semibold tabular-nums">{formatCLP(order.totalCLP)}</dd>
        </dl>
      </article>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="h-11" onClick={onReset}>
          Hacer otro pago (demo)
        </Button>
        <Button type="button" variant="ghost" className="h-11" render={<Link href="/" />}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}

function StepActions({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      <Button type="button" variant="outline" className="h-11" onClick={onBack}>
        <ArrowLeftIcon data-icon="inline-start" aria-hidden />
        Volver
      </Button>
      {children}
    </div>
  );
}
