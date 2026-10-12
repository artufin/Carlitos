"use client";

// NOT IMPLEMENTED (MVP): mock report form and "Mis reportes" list.
// All state lives in memory and is lost on reload. No API calls.

import { useState, type FormEvent } from "react";
import { CheckCircle2Icon, InfoIcon, UserIcon, UserRoundXIcon } from "lucide-react";
import { cn } from "cn";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRelative } from "@/lib/format";
import { mockProfile } from "@/lib/mocks/profile";
import { exampleClassification, mockReports, reportCategories, reportStatusLabel } from "@/lib/mocks/reports";
import { DAILY_REPORT_LIMIT, reportInputSchema } from "@/lib/services/reports/input";
import type { MockReport } from "@/lib/types/report";

const SEVERITY_LABEL: Record<number, string> = { 1: "baja", 2: "media", 3: "alta" };

export function ReportsMock() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<MockReport[]>(mockReports);
  const [submitted, setSubmitted] = useState<MockReport | null>(null);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = reportInputSchema.safeParse({ text, category: category || undefined, anonymous });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el formulario.");
      return;
    }
    setError(null);
    const report: MockReport = {
      id: `rep-${Date.now()}`,
      text: parsed.data.text,
      category: parsed.data.category ?? null,
      anonymous: parsed.data.anonymous,
      status: "received",
      createdAt: new Date().toISOString(),
      classification: exampleClassification(parsed.data.text, parsed.data.category ?? null),
    };
    setReports((prev) => [report, ...prev]);
    setSubmitted(report);
    setText("");
    setCategory("");
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-200">
            <CheckCircle2Icon className="size-5" aria-hidden />
            Reporte recibido, clasificación pendiente
          </p>
          <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
            {submitted.anonymous ? "Lo enviaste de forma anónima." : `Lo enviaste como ${mockProfile.name}.`} Te avisaremos cuando cambie
            de estado.
          </p>
        </div>

        {submitted.classification && (
          <div className="rounded-xl border p-4 text-sm">
            <p className="mb-2 text-xs font-medium tracking-wide text-amber-700 uppercase dark:text-amber-300">
              Ejemplo: la clasificación automática aún no está activa
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-muted-foreground">Categoría</dt>
              <dd>{reportCategories.find((c) => c.slug === submitted.classification?.category)?.label ?? submitted.classification.category}</dd>
              <dt className="text-muted-foreground">Lugar</dt>
              <dd>{submitted.classification.place ?? "no detectado"}</dd>
              <dt className="text-muted-foreground">Gravedad</dt>
              <dd>
                {submitted.classification.severity} ({SEVERITY_LABEL[submitted.classification.severity]})
              </dd>
              <dt className="text-muted-foreground">Resumen</dt>
              <dd>{submitted.classification.summary}</dd>
              <dt className="text-muted-foreground">Falta información</dt>
              <dd>{submitted.classification.missingInfo ? "sí" : "no"}</dd>
            </dl>
          </div>
        )}

        <Button type="button" className="h-11" onClick={() => setSubmitted(null)}>
          Volver a reportes
        </Button>
        <MyReports reports={reports} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="report-text">¿Qué pasó?</Label>
          <Textarea
            id="report-text"
            rows={5}
            maxLength={2000}
            placeholder="Ej: En la sala B-21 hay enchufes que no funcionan desde hace dos semanas."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={error ? true : undefined}
          />
          <p className="text-xs text-muted-foreground">{text.length}/2000</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-category">Categoría (opcional)</Label>
          <NativeSelect id="report-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Sin categoría</option>
            {reportCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">¿Cómo quieres enviarlo?</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: false, label: "Identificado", icon: UserIcon, hint: `${mockProfile.name} · ${mockProfile.email}` },
              { value: true, label: "Anónimo", icon: UserRoundXIcon, hint: "No se guarda ningún dato tuyo" },
            ].map((option) => (
              <label
                key={String(option.value)}
                className={cn(
                  "flex min-h-14 cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  anonymous === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                )}
              >
                <input
                  type="radio"
                  name="anonymous"
                  className="sr-only"
                  checked={anonymous === option.value}
                  onChange={() => setAnonymous(option.value)}
                />
                <option.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="h-11 w-full sm:w-auto">
          Enviar reporte
        </Button>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          En producción habrá un máximo de {DAILY_REPORT_LIMIT} reportes por día. En esta demo no se aplica.
        </p>
      </form>

      <MyReports reports={reports} />
    </div>
  );
}

function MyReports({ reports }: { reports: MockReport[] }) {
  return (
    <section>
      <h2 className="mb-2 font-heading text-lg font-semibold">Mis reportes</h2>
      <ul className="divide-y rounded-xl border text-sm">
        {reports.map((report) => (
          <li key={report.id} className="space-y-1 p-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-xs font-medium",
                  report.status === "resolved"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : report.status === "in_review"
                      ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {reportStatusLabel[report.status]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelative(report.createdAt)} · {report.anonymous ? "anónimo" : "identificado"}
              </span>
            </div>
            <p className="line-clamp-2">{report.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
