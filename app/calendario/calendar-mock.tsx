"use client";

// NOT IMPLEMENTED (MVP): mock calendar with a month grid, an upcoming list,
// type filters, an event dialog with sign-up and a fake ".ics" subscription
// dialog. All state lives in memory and is lost on reload. No API calls.

import { useMemo, useState } from "react";
import { CalendarPlusIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, MapPinIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventDialog } from "@/app/calendario/event-dialog";
import { EventTypeBadge, eventTypeStyle } from "@/app/calendario/event-type-badge";
import { formatTimeRange } from "@/app/calendario/event-utils";
import { IcsDialog } from "@/app/calendario/ics-dialog";
import { CHILE_TIME_ZONE, formatDate } from "@/lib/format";
import { eventTypeLabel, eventTypes, mockEvents, mockNow } from "@/lib/mocks/calendar";
import type { CalendarEvent, EventRegistration, EventType } from "@/lib/types/calendar";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const monthFormatter = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("es-CL", { timeZone: CHILE_TIME_ZONE, weekday: "long" });

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Cells for a Monday-first month grid; `null` pads the first/last week. */
function buildMonthCells(cursor: Date): (Date | null)[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarMock() {
  const [view, setView] = useState("mes");
  const [activeTypes, setActiveTypes] = useState<EventType[]>(eventTypes);
  const [cursor, setCursor] = useState(() => startOfMonth(mockNow));
  const [selectedDay, setSelectedDay] = useState<string>(() => dayKey(mockNow));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, EventRegistration>>({});
  const [icsOpen, setIcsOpen] = useState(false);

  const filtered = useMemo(
    () =>
      mockEvents
        .filter((e) => activeTypes.includes(e.type))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [activeTypes],
  );
  const upcoming = useMemo(() => filtered.filter((e) => new Date(e.endsAt) >= mockNow), [filtered]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of filtered) {
      const key = dayKey(new Date(event.startsAt));
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [filtered]);

  const cells = useMemo(() => buildMonthCells(cursor), [cursor]);
  const selectedDayEvents = byDay.get(selectedDay) ?? [];
  const selectedEvent = mockEvents.find((e) => e.id === selectedEventId) ?? null;
  const todayKey = dayKey(mockNow);

  function toggleType(type: EventType) {
    setActiveTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function moveMonth(delta: number) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function register(registration: EventRegistration) {
    setRegistrations((prev) => ({ ...prev, [registration.eventId]: registration }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={view} onValueChange={(value) => setView(String(value))}>
          <TabsList aria-label="Tipo de vista">
            <TabsTrigger value="mes" className="min-w-20">
              Mes
            </TabsTrigger>
            <TabsTrigger value="lista" className="min-w-20">
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button type="button" variant="outline" className="h-11" onClick={() => setIcsOpen(true)}>
          <CalendarPlusIcon aria-hidden />
          Suscribirme al calendario (.ics)
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {eventTypes.map((type) => {
          const active = activeTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              onClick={() => toggleType(type)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                active ? "border-foreground/20 bg-foreground/5" : "border-dashed text-muted-foreground hover:bg-muted/60",
              )}
            >
              <span className={cn("size-2.5 rounded-full", eventTypeStyle[type].dot, !active && "opacity-40")} aria-hidden />
              {eventTypeLabel[type]}
              {active && <CheckIcon className="size-3.5" aria-hidden />}
            </button>
          );
        })}
      </div>

      <Tabs value={view} onValueChange={(value) => setView(String(value))}>
        <TabsContent value="mes" className="space-y-3">
          <div className="rounded-xl border p-3">
            <div className="mb-2 flex items-center justify-between">
              <Button type="button" variant="ghost" size="icon" className="size-11" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
                <ChevronLeftIcon />
              </Button>
              <h2 className="font-heading text-base font-semibold" aria-live="polite">
                {capitalize(monthFormatter.format(cursor))}
              </h2>
              <Button type="button" variant="ghost" size="icon" className="size-11" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
                <ChevronRightIcon />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground" aria-hidden>
              {WEEKDAYS.map((day, i) => (
                <span key={i} className="py-1">
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Días del mes">
              {cells.map((date, i) => {
                if (!date) return <span key={`pad-${i}`} aria-hidden />;
                const key = dayKey(date);
                const events = byDay.get(key) ?? [];
                const isToday = key === todayKey;
                const isSelected = key === selectedDay;
                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={`${date.getDate()} de ${monthFormatter.format(date)}${events.length ? `, ${events.length} evento${events.length === 1 ? "" : "s"}` : ""}`}
                    onClick={() => setSelectedDay(key)}
                    className={cn(
                      "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/60",
                      isToday && !isSelected && "font-semibold ring-1 ring-foreground/30",
                    )}
                  >
                    <span>{date.getDate()}</span>
                    <span className="flex h-1.5 gap-0.5" aria-hidden>
                      {events.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={cn("size-1.5 rounded-full", isSelected ? "bg-primary-foreground/80" : eventTypeStyle[e.type].dot)}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <section aria-live="polite">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {selectedDayEvents.length
                ? `${selectedDayEvents.length} evento${selectedDayEvents.length === 1 ? "" : "s"} el día seleccionado`
                : "Sin eventos el día seleccionado"}
            </h3>
            <EventList events={selectedDayEvents} registrations={registrations} onSelect={setSelectedEventId} />
          </section>
        </TabsContent>

        <TabsContent value="lista" className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Próximos eventos</h2>
          {upcoming.length ? (
            <EventList events={upcoming} registrations={registrations} onSelect={setSelectedEventId} showDate />
          ) : (
            <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">No hay eventos próximos con esos filtros.</p>
          )}
        </TabsContent>
      </Tabs>

      <EventDialog
        key={selectedEvent?.id ?? "none"}
        event={selectedEvent}
        registration={selectedEvent ? (registrations[selectedEvent.id] ?? null) : null}
        onRegister={register}
        onClose={() => setSelectedEventId(null)}
      />
      <IcsDialog open={icsOpen} onOpenChange={setIcsOpen} />
    </div>
  );
}

function EventList({
  events,
  registrations,
  onSelect,
  showDate = false,
}: {
  events: CalendarEvent[];
  registrations: Record<string, EventRegistration>;
  onSelect: (id: string) => void;
  showDate?: boolean;
}) {
  if (!events.length) return null;
  return (
    <ul className="space-y-2">
      {events.map((event) => {
        const slotsLeft = event.capacity - event.registered;
        const registered = Boolean(registrations[event.id]);
        return (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => onSelect(event.id)}
              className="flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", eventTypeStyle[event.type].dot)} aria-hidden />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <EventTypeBadge type={event.type} />
                  {registered && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <CheckIcon className="size-3" aria-hidden /> Inscrito
                    </span>
                  )}
                </span>
                <span className="block font-medium">{event.title}</span>
                <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="size-3" aria-hidden />
                    {showDate
                      ? `${capitalize(weekdayFormatter.format(new Date(event.startsAt)))} ${formatDate(event.startsAt)} · ${formatTimeRange(event)}`
                      : formatTimeRange(event)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="size-3" aria-hidden />
                    {event.place}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right text-xs text-muted-foreground">
                <span className="block font-medium text-foreground">+{event.points} pts</span>
                <span className="block">{slotsLeft > 0 ? `${slotsLeft} cupos` : "Sin cupos"}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
