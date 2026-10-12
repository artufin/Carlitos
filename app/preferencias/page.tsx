import type { Metadata } from "next";
import { PreferencesForm } from "@/app/preferencias/preferences-form";
import { PageHeader } from "@/components/mock-badge";
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
    </div>
  );
}
