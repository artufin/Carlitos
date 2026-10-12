"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CoinsIcon,
  CreditCardIcon,
  FlagIcon,
  HomeIcon,
  ImagesIcon,
  MenuIcon,
  PackageIcon,
  SettingsIcon,
  ShieldIcon,
  TrophyIcon,
} from "lucide-react";
import { cn } from "cn";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const PRIMARY = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarDaysIcon },
  { href: "/logros", label: "Logros", icon: TrophyIcon },
  { href: "/puntos", label: "CAiPuntos", icon: CoinsIcon },
] as const;

const MORE = [
  { href: "/manual", label: "Manual novato", icon: BookOpenIcon, mock: true },
  { href: "/galeria", label: "Galería", icon: ImagesIcon, mock: true },
  { href: "/prestamos", label: "Préstamos", icon: PackageIcon, mock: true },
  { href: "/pagos", label: "Pagos", icon: CreditCardIcon, mock: true },
  { href: "/reportes", label: "Reportes", icon: FlagIcon, mock: true },
  { href: "/preferencias", label: "Preferencias", icon: SettingsIcon, mock: false },
  { href: "/admin", label: "Admin (demo)", icon: ShieldIcon, mock: false },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = MORE.some((m) => isActive(pathname, m.href));

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80"
    >
      <ul className="mx-auto grid h-16 max-w-3xl grid-cols-5">
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="contents">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="contents">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Más secciones"
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset",
                moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MenuIcon className="size-5" aria-hidden />
              Más
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-[max(env(safe-area-inset-bottom),1rem)]">
              <SheetHeader>
                <SheetTitle>Más secciones</SheetTitle>
                <SheetDescription>Las secciones marcadas son maquetas sin datos reales.</SheetDescription>
              </SheetHeader>
              <ul className="grid grid-cols-2 gap-2 px-4">
                {MORE.map(({ href, label, icon: Icon, mock }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        isActive(pathname, href) && "border-primary/40 bg-primary/5",
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="flex-1">{label}</span>
                      {mock && (
                        <span className="rounded-sm bg-muted px-1 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          Maqueta
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
