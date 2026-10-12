// NOT IMPLEMENTED (MVP): mock view, no points are stored or redeemed for real.
import type { Metadata } from "next";
import { PointsMock } from "@/app/puntos/points-mock";
import { PageHeader } from "@/components/mock-badge";

export const metadata: Metadata = { title: "CAiPuntos" };

export default function PointsPage() {
  return (
    <div>
      <PageHeader
        title="CAiPuntos"
        mock
        description="Gana puntos participando y cámbialos por recompensas. En esta demo los canjes no son reales."
      />
      <PointsMock />
    </div>
  );
}
