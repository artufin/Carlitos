// NOT IMPLEMENTED (MVP): mock payment flow. No processor, no API, nothing is charged.
import type { Metadata } from "next";
import { PaymentsMock } from "@/app/pagos/payments-mock";
import { PageHeader } from "@/components/mock-badge";

export const metadata: Metadata = { title: "Pagos" };

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader
        title="Pagos"
        mock
        description="Cuotas, entradas y merch del CAi. Esta pantalla es una demostración: no se procesa ningún pago."
      />
      <PaymentsMock />
    </div>
  );
}
