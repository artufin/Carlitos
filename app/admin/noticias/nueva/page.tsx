import type { Metadata } from "next";
import { NewsForm } from "@/components/admin/news-form";
import { PageHeader } from "@/components/mock-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { listTopics } from "@/lib/services/topics";

export const metadata: Metadata = { title: "Nueva noticia" };

export default async function NewNewsPage() {
  await requireAdmin();
  const topics = await listTopics();
  return (
    <div>
      <PageHeader title="Nueva noticia" />
      <NewsForm topics={topics.map((t) => ({ id: t.id, name: t.name }))} />
    </div>
  );
}
