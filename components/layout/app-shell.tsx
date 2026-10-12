"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";

/** Routes rendered full-screen without header or bottom navigation. */
const IMMERSIVE_PREFIXES = ["/manual", "/login"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = IMMERSIVE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (immersive) {
    return <main className="flex min-h-dvh flex-col">{children}</main>;
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              CAi
            </span>
            <span className="sr-only">Centro de Alumnos de Ingeniería</span>
          </Link>
          <Link
            href="/login"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Ingresar
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
