import type { Metadata } from "next";
import { AdminNav } from "@/app/admin/admin-nav";
import { ADMIN_IS_OPEN, requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · CAi" } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // NOT IMPLEMENTED (MVP): requireAdmin() does not verify anything yet.
  await requireAdmin();

  return (
    <div className="space-y-4">
      {ADMIN_IS_OPEN && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <strong>Demo sin protección:</strong> el panel de administración está abierto a cualquiera. No lo uses con datos
          ni suscriptores reales.
        </p>
      )}
      <AdminNav />
      {children}
    </div>
  );
}
