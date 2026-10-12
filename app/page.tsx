import Link from "next/link";
import { PageHeader } from "@/components/mock-badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session/user";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div>
      <PageHeader title="Noticias" description="Tu feed personalizado del CAi." />
      <div className="rounded-xl border p-4 text-sm">
        <p>
          Sesión por dispositivo: <code className="font-mono text-xs">{user ? user.id : "sin cookie"}</code>
        </p>
        <Button render={<Link href="/preferencias" />} className="mt-3">
          Elegir mis temas
        </Button>
      </div>
    </div>
  );
}
