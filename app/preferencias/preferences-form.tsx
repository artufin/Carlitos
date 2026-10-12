"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export interface TopicOption {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
}

export function PreferencesForm({ topics, initialSelected }: { topics: TopicOption[]; initialSelected: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/preferences", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topicIds: [...selected] }),
    });
    if (!response.ok) {
      setMessage({ kind: "error", text: "No pudimos guardar tus temas. Inténtalo de nuevo." });
      return;
    }
    setMessage({ kind: "ok", text: "Temas guardados." });
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset>
        <legend className="sr-only">Temas</legend>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topics.map((topic) => {
            const checked = selected.has(topic.id);
            return (
              <li key={topic.id}>
                <label
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    checked ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle(topic.id)}
                    name="topicIds"
                    value={topic.id}
                  />
                  <span aria-hidden className="text-xl">
                    {topic.emoji ?? "•"}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{topic.name}</span>
                    {topic.description && <span className="block text-xs text-muted-foreground">{topic.description}</span>}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border",
                      checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {checked && <CheckIcon className="size-3.5" />}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" className="h-11 min-w-32" disabled={pending}>
          Guardar
        </Button>
        {message && (
          <p role="status" className={cn("text-sm", message.kind === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
