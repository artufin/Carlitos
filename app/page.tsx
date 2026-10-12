import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { NewsCard } from "@/components/news/news-card";
import { PageHeader } from "@/components/mock-badge";
import { Button } from "@/components/ui/button";
import { recordImpressions } from "@/lib/services/interactions";
import { getFeedForUser } from "@/lib/services/news";
import { getCurrentUser } from "@/lib/session/user";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div>
        <PageHeader title="Noticias" />
        <p className="rounded-xl border p-4 text-sm text-muted-foreground">
          No pudimos crear tu sesión de dispositivo. Recarga la página o revisa que las cookies estén habilitadas.
        </p>
      </div>
    );
  }

  const { news, topicIds } = await getFeedForUser(user);
  await recordImpressions(
    user.id,
    news.map((n) => n.id),
  );

  return (
    <div>
      <PageHeader
        title="Noticias"
        description={topicIds.length > 0 ? "Según los temas que sigues." : "Todas las noticias del CAi."}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/preferencias" />}>
            <SettingsIcon aria-hidden />
            Mis temas
          </Button>
        }
      />

      {topicIds.length === 0 && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium">Personaliza tu feed</p>
          <p className="mt-1 text-muted-foreground">
            Elige los temas que te interesan y te mostraremos solo lo relevante. También podrás recibir avisos push.
          </p>
          <Button size="sm" className="mt-3" render={<Link href="/preferencias" />}>
            Elegir temas
          </Button>
        </div>
      )}

      {news.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aún no hay noticias para tus temas. Prueba agregando más en{" "}
          <Link href="/preferencias" className="underline underline-offset-4">
            preferencias
          </Link>
          .
        </p>
      ) : (
        <div className="relative space-y-3 [&>article]:relative">
          {news.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}
    </div>
  );
}
