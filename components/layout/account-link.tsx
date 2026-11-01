"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserIcon } from "lucide-react";
import type { PublicAccount } from "@/lib/auth/auth-service";

const linkClass =
  "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

/** Header link: "Ingresar" for visitors, the account name for logged-in users. */
export function AccountLink() {
  const pathname = usePathname();
  const [account, setAccount] = useState<PublicAccount | null>(null);

  // Re-check on navigation so the header updates right after login/logout.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { account: null }))
      .then((body: { account: PublicAccount | null }) => {
        if (!cancelled) setAccount(body.account);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!account) {
    return (
      <Link href="/login" className={linkClass}>
        Ingresar
      </Link>
    );
  }

  return (
    <Link href="/cuenta" className={linkClass}>
      <UserIcon aria-hidden className="size-4" />
      <span className="max-w-32 truncate">{account.name ?? account.email}</span>
    </Link>
  );
}
