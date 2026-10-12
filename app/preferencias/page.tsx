import type { Metadata } from "next";
import { PreferencesForm } from "@/app/preferencias/preferences-form";
import { PageHeader } from "@/components/mock-badge";
import { EnablePushButton } from "@/components/push/enable-push-button";
import { getUserTopicIds, listTopics } from "@/lib/services/topics";
import { getCurrentUser } from "@/lib/session/user";

export const metadata: Metadata = { title: "Preferencias" };
export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const [topics, user] = await Promise.all([listTopics(), getCurrentUser()]);
  const selected = user ? await getUserTopicIds(user.id) : [];

  return (
    <div>
      <PageHeader title="Mis temas" description="Elige qué noticias quieres ver y sobre qué recibir avisos." />
      <PreferencesForm
        topics={topics.map((t) => ({ id: t.id, name: t.name, description: t.description, emoji: t.emoji }))}
        initialSelected={selected}
      />

      <section className="mt-8 rounded-xl border p-4">
        <h2 className="font-heading text-lg font-semibold">Avisos push</h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Recibe una notificación cuando publiquemos algo de tus temas. Solo pediremos permiso cuando toques el botón.
        </p>
        <EnablePushButton />
      </section>
    </div>
  );
}
