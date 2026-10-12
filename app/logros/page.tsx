// NOT IMPLEMENTED (MVP): mock view, completion state is not persisted.
import type { Metadata } from "next";
import { AchievementsMock } from "@/app/logros/achievements-mock";
import { PageHeader } from "@/components/mock-badge";

export const metadata: Metadata = { title: "Logros" };

export default function AchievementsPage() {
  return (
    <div>
      <PageHeader
        title="Logros"
        mock
        description="Tu bucket list de la escuela. En esta demo el progreso se pierde al recargar."
      />
      <AchievementsMock />
    </div>
  );
}
