import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/cuenta/logout-button";
import { PageHeader } from "@/components/mock-badge";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session/user";

export const metadata: Metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const userId = await getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  if (!user?.email) redirect("/login");

  return (
    <div>
      <PageHeader title="Mi cuenta" />
      <dl className="space-y-3 rounded-xl border p-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Nombre</dt>
          <dd className="font-medium">{user.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Correo</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Miembro desde</dt>
          <dd className="font-medium">{user.createdAt.toLocaleDateString("es-CL", { dateStyle: "long" })}</dd>
        </div>
      </dl>
      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
