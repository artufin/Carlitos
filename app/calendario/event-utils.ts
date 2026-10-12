// NOT IMPLEMENTED (MVP): formatting helpers shared by the calendar mock.

import { CHILE_TIME_ZONE } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types/calendar";

const timeFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: CHILE_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatTime(date: Date | string) {
  return timeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** "18:00 – 20:00" */
export function formatTimeRange(event: CalendarEvent) {
  return `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}`;
}
