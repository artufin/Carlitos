// NOT IMPLEMENTED (MVP): shapes used by the mock calendar view. Designed to
// become Prisma models (`Event`, `EventExtraField`, `EventRegistration`) once
// the real feature is wired.

export type EventType = "carrete" | "academico" | "alianza" | "taller";

/** Extra question asked on sign-up, configured per event. */
export interface EventExtraField {
  id: string;
  label: string;
  type: "text" | "select";
  /** Only for `type: "select"`. */
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  description: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  place: string;
  /** Total slots ("cupos"). */
  capacity: number;
  /** Slots already taken. */
  registered: number;
  /** CAiPuntos granted for attending. */
  points: number;
  extraFields: EventExtraField[];
}

/** In-memory sign-up produced by the mock form. */
export interface EventRegistration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  generation: number;
  major: string;
  /** Answers to `extraFields`, keyed by field id. */
  extra: Record<string, string>;
  createdAt: string; // ISO
}
