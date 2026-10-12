// NOT IMPLEMENTED (MVP): mock view, nothing is read from or sent to the server.
import type { Metadata } from "next";
import { CalendarMock } from "@/app/calendario/calendar-mock";
import { PageHeader } from "@/components/mock-badge";

export const metadata: Metadata = { title: "Calendario" };

export default function CalendarPage() {
  return (
    <div>
      <PageHeader
        title="Calendario"
        mock
        description="Carretes, charlas, alianzas y talleres del CAi. En esta demo las inscripciones no se guardan."
      />
      <CalendarMock />
    </div>
  );
}
