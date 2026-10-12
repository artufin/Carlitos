export const CHILE_TIME_ZONE = "America/Santiago";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: CHILE_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: CHILE_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** "hace 3 días", "hace 2 h", "recién". */
export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} día${days === 1 ? "" : "s"}`;
  return formatDate(target);
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);
}
