import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { recordClick } from "@/lib/services/interactions";
import { getNewsById } from "@/lib/services/news";
import { getCurrentUser } from "@/lib/session/user";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const news = await getNewsById(id);
  return { title: news?.title ?? "Noticia" };
}

export default async function NewsDetailPage({ params }: Params) {
  const { id } = await params;
  const news = await getNewsById(id);
  if (!news) notFound();

  const user = await getCurrentUser();
  if (user) await recordClick(user.id, news.id);

  return (
    <article className="space-y-4">
      <Button variant="ghost" size="sm" render={<Link href="/" />} className="-ml-2">
        <ArrowLeftIcon aria-hidden />
        Volver al feed
      </Button>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">
          {news.topic.emoji ? <span aria-hidden>{news.topic.emoji}</span> : null}
          {news.topic.name}
        </Badge>
        <time dateTime={news.publishedAt.toISOString()}>{formatDateTime(news.publishedAt)}</time>
      </div>
      <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight">{news.title}</h1>
      <p className="text-base text-muted-foreground">{news.summary}</p>
      <div className="space-y-3 text-[15px] leading-relaxed">
        {news.body.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
