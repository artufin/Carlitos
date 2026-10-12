"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BellIcon, SendIcon } from "lucide-react";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TopicOption {
  id: string;
  name: string;
}

interface NewsValues {
  id: string;
  title: string;
  summary: string;
  body: string;
  topicId: string;
}

interface PushStatus {
  notifiedAt: string | null;
  sent: number;
  failed: number;
  gone: number;
  pending: number;
}

interface PushResult {
  recipients: number;
  sent: number;
  failed: number;
  gone: number;
  queued: number;
}

export function NewsForm({ topics, news, pushStatus }: { topics: TopicOption[]; news?: NewsValues; pushStatus?: PushStatus }) {
  const router = useRouter();
  const [values, setValues] = useState({
    title: news?.title ?? "",
    summary: news?.summary ?? "",
    body: news?.body ?? "",
    topicId: news?.topicId ?? topics[0]?.id ?? "",
    notify: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "push" | null>(null);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy("save");
    try {
      const response = await fetch(news ? `/api/admin/news/${news.id}` : "/api/admin/news", {
        method: news ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { error?: string; push?: PushResult };
      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      const summary = data.push
        ? ` Push: ${data.push.sent} enviadas, ${data.push.failed} fallidas, ${data.push.gone} eliminadas, ${data.push.queued} en cola.`
        : "";
      router.push(`/admin/noticias?ok=${encodeURIComponent((news ? "Noticia actualizada." : "Noticia creada.") + summary)}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onResend() {
    if (!news) return;
    setError(null);
    setBusy("push");
    try {
      const response = await fetch(`/api/admin/news/${news.id}/notify`, { method: "POST" });
      const data = (await response.json()) as { error?: string; push?: PushResult };
      if (!response.ok) {
        setError(data.error ?? "No se pudo enviar.");
        return;
      }
      setPushResult(data.push ?? null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" required maxLength={140} value={values.title} onChange={(e) => update("title", e.target.value)} className="h-10" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Resumen (se usa en la notificación)</Label>
        <Textarea id="summary" required maxLength={280} rows={2} value={values.summary} onChange={(e) => update("summary", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Cuerpo</Label>
        <Textarea id="body" required rows={8} value={values.body} onChange={(e) => update("body", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="topicId">Tema</Label>
        <NativeSelect id="topicId" value={values.topicId} onChange={(e) => update("topicId", e.target.value)} required>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
        <input type="checkbox" className="size-4 accent-primary" checked={values.notify} onChange={(e) => update("notify", e.target.checked)} />
        <span className="flex-1 text-sm">
          <span className="flex items-center gap-1 font-medium">
            <BellIcon className="size-4" aria-hidden /> Enviar notificación push
          </span>
          <span className="block text-xs text-muted-foreground">A quienes siguen este tema y activaron avisos. Se envía al guardar.</span>
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className="h-11 min-w-32" disabled={busy !== null}>
          {busy === "save" ? "Guardando…" : news ? "Guardar cambios" : "Publicar"}
        </Button>
        {news && (
          <Button type="button" variant="outline" className="h-11" disabled={busy !== null} onClick={onResend}>
            <SendIcon aria-hidden />
            {busy === "push" ? "Enviando…" : "Enviar push ahora"}
          </Button>
        )}
      </div>

      {pushResult && (
        <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm">
          Push: {pushResult.sent} enviadas, {pushResult.failed} fallidas, {pushResult.gone} suscripciones eliminadas, {pushResult.queued} en cola de {pushResult.recipients} destinatarios.
        </p>
      )}

      {pushStatus && (
        <dl className="grid grid-cols-2 gap-2 rounded-xl border p-3 text-xs sm:grid-cols-5">
          <div>
            <dt className="text-muted-foreground">Último envío</dt>
            <dd className="font-medium">{pushStatus.notifiedAt ?? "nunca"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Enviadas</dt>
            <dd className="font-medium">{pushStatus.sent}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fallidas</dt>
            <dd className="font-medium">{pushStatus.failed}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Eliminadas (410)</dt>
            <dd className="font-medium">{pushStatus.gone}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pendientes</dt>
            <dd className="font-medium">{pushStatus.pending}</dd>
          </div>
        </dl>
      )}
    </form>
  );
}
