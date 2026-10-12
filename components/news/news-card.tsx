import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/format";
import type { NewsWithTopic } from "@/lib/services/news";
import { newsPath } from "@/lib/services/news";

export function NewsCard({ news }: { news: NewsWithTopic }) {
  return (
    <article className="rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">
          {news.topic.emoji ? <span aria-hidden>{news.topic.emoji}</span> : null}
          {news.topic.name}
        </Badge>
        <time dateTime={news.publishedAt.toISOString()}>{formatRelative(news.publishedAt)}</time>
      </div>
      <h2 className="font-heading text-lg leading-snug font-semibold">
        <Link
          href={newsPath(news.id)}
          className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:[&>span]:ring-3 focus-visible:[&>span]:ring-ring/50"
        >
          <span className="relative rounded-sm">{news.title}</span>
        </Link>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{news.summary}</p>
    </article>
  );
}
