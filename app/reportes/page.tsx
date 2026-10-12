import type { Metadata } from "next";
import { ReportsMock } from "@/app/reportes/reports-mock";
import { PageHeader } from "@/components/mock-badge";

export const metadata: Metadata = { title: "Reportes" };

// NOT IMPLEMENTED (MVP): mock view, nothing is sent to the server.
export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reportes"
        mock
        description="Cuéntanos problemas de infraestructura, carga académica u otros. En esta demo no se guarda nada."
      />
      <ReportsMock />
    </div>
  );
}
