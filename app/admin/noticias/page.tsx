import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/mock-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateTime } from "@/lib/format";
import { listAllNews } from "@/lib/services/news";

export const metadata: Metadata = { title: "Noticias" };

export default async function AdminNewsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireAdmin();
  const [news, params] = await Promise.all([listAllNews(), searchParams]);

  return (
    <div>
      <PageHeader
        title="Noticias"
        description={`${news.length} publicadas`}
        actions={
          <Button render={<Link href="/admin/noticias/nueva" />}>
            <PlusIcon aria-hidden />
            Nueva
          </Button>
        }
      />
      {params.ok && (
        <p role="status" className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {params.ok}
        </p>
      )}
      <ul className="divide-y rounded-xl border">
        {news.map((item) => (
          <li key={item.id}>
            <Link
              href={`/admin/noticias/${item.id}`}
              className="flex items-start justify-between gap-3 p-3 hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.topic.name} · {formatDateTime(item.publishedAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                {item.notifiedAt ? (
                  <Badge variant="secondary">push enviado</Badge>
                ) : item.notifyRequested ? (
                  <Badge variant="outline">push pendiente</Badge>
                ) : null}
                <span>{item._count.deliveries} entregas</span>
              </div>
            </Link>
          </li>
        ))}
        {news.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Sin noticias. Crea la primera.</li>}
      </ul>
    </div>
  );
}
