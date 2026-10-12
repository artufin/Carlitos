import { cn } from "cn";

/**
 * Discreet label shown on every mock view (NOT IMPLEMENTED (MVP)).
 * Keep it visible so nobody mistakes a mock for a working feature.
 */
export function MockBadge({ className, label = "Maqueta" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-dashed border-amber-500/60 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium tracking-wide text-amber-800 uppercase dark:bg-amber-950/40 dark:text-amber-200",
        className,
      )}
      title="Vista de demostración: sin datos reales ni conexión al servidor"
    >
      {label}
    </span>
  );
}

/** Page heading used across the app, with an optional mock badge. */
export function PageHeader({
  title,
  description,
  mock = false,
  actions,
}: {
  title: string;
  description?: string;
  mock?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
          {title}
          {mock && <MockBadge />}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
