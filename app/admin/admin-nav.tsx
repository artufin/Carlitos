"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const ITEMS = [
  { href: "/admin/noticias", label: "Noticias" },
  { href: "/admin/entregas", label: "Entregas push" },
  { href: "/admin/reportes", label: "Reportes", mock: true },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de administración" className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1 rounded-md px-3 text-sm font-medium whitespace-nowrap focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {"mock" in item && item.mock && <span className="text-[10px] text-amber-700 uppercase dark:text-amber-300">maqueta</span>}
          </Link>
        );
      })}
    </nav>
  );
}
