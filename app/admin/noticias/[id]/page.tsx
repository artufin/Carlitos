import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsForm } from "@/components/admin/news-form";
import { PageHeader } from "@/components/mock-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateTime } from "@/lib/format";
import { getNewsById } from "@/lib/services/news";
import { listTopics } from "@/lib/services/topics";

export const metadata: Metadata = { title: "Editar noticia" };

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [news, topics] = await Promise.all([getNewsById(id), listTopics()]);
  if (!news) notFound();

  return (
    <div>
      <PageHeader title="Editar noticia" description={`Publicada ${formatDateTime(news.publishedAt)}`} />
      <NewsForm
        topics={topics.map((t) => ({ id: t.id, name: t.name }))}
        news={{ id: news.id, title: news.title, summary: news.summary, body: news.body, topicId: news.topicId }}
      />
    </div>
  );
}
