// NOT IMPLEMENTED (MVP): visual helpers shared by the calendar mock.

import { cn } from "cn";
import { eventTypeLabel } from "@/lib/mocks/calendar";
import type { EventType } from "@/lib/types/calendar";

/** Tailwind classes per event type (dot for the grid, badge for lists). */
export const eventTypeStyle: Record<EventType, { dot: string; badge: string }> = {
  carrete: {
    dot: "bg-fuchsia-500",
    badge: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200",
  },
  academico: {
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  },
  alianza: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  taller: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
};

export function EventTypeBadge({ type, className }: { type: EventType; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium", eventTypeStyle[type].badge, className)}>
      {eventTypeLabel[type]}
    </span>
  );
}
