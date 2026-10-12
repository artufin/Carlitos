// NOT IMPLEMENTED (MVP): mock view, nothing is read from or sent to the server.
import type { Metadata } from "next";
import { LoansMock } from "@/app/prestamos/loans-mock";
import { PageHeader } from "@/components/mock-badge";

export const metadata: Metadata = { title: "Préstamos" };

export default function LoansPage() {
  return (
    <div>
      <PageHeader
        title="Préstamos"
        mock
        description="Pide calculadoras, delantales y otros ítems del CAi. En esta demo las solicitudes no se guardan."
      />
      <LoansMock />
    </div>
  );
}
