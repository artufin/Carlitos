import type { Metadata } from "next";
import { AdminReportsMock } from "@/app/admin/reportes/admin-reports-mock";
import { PageHeader } from "@/components/mock-badge";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Reportes" };

// NOT IMPLEMENTED (MVP): mock admin list fed by lib/mocks/reports.ts.
export default async function AdminReportsPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader title="Reportes" mock description="Lista de ejemplo. Los cambios de estado solo viven en memoria." />
      <AdminReportsMock />
    </div>
  );
}
