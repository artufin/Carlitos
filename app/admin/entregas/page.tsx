import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/mock-badge";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Entregas push" };

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  SENT: { label: "enviada", variant: "secondary" },
  FAILED: { label: "fallida", variant: "destructive" },
  GONE: { label: "eliminada (410)", variant: "outline" },
};

export default async function DeliveriesPage() {
  await requireAdmin();
  const [deliveries, totals, pendingJobs, subscriptions] = await Promise.all([
    prisma.pushDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { news: { select: { id: true, title: true } } },
    }),
    prisma.pushDelivery.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.notificationJob.groupBy({
      by: ["newsId"],
      where: { status: "PENDING" },
      _count: { _all: true },
    }),
    prisma.pushSubscription.count(),
  ]);
  const count = (status: string) => totals.find((t) => t.status === status)?._count._all ?? 0;
  const pendingNews = pendingJobs.length
    ? await prisma.news.findMany({ where: { id: { in: pendingJobs.map((j) => j.newsId) } }, select: { id: true, title: true } })
    : [];

  return (
    <div>
      <PageHeader title="Entregas push" description={`${subscriptions} suscripciones activas`} />

      <dl className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
        {(["SENT", "FAILED", "GONE"] as const).map((status) => (
          <div key={status} className="rounded-xl border p-3">
            <dt className="text-xs text-muted-foreground">{STATUS_LABEL[status].label}</dt>
            <dd className="text-xl font-semibold">{count(status)}</dd>
          </div>
        ))}
      </dl>

      {pendingJobs.length > 0 && (
        <section className="mb-4 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
          <h2 className="font-medium">Jobs pendientes (NOT IMPLEMENTED (MVP): sin worker)</h2>
          <ul className="mt-1 space-y-1 text-muted-foreground">
            {pendingJobs.map((job) => (
              <li key={job.newsId}>
                {job._count._all} destinatarios ·{" "}
                <Link href={`/admin/noticias/${job.newsId}`} className="underline underline-offset-4">
                  {pendingNews.find((n) => n.id === job.newsId)?.title ?? job.newsId}
                </Link>{" "}
                (vuelve a “Enviar push ahora” para drenarlos)
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="divide-y rounded-xl border text-sm">
        {deliveries.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <Link href={`/admin/noticias/${d.news.id}`} className="block truncate font-medium hover:underline">
                {d.news.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(d.createdAt)} · usuario {d.userId.slice(0, 8)}
                {d.statusCode ? ` · HTTP ${d.statusCode}` : ""}
                {d.error ? ` · ${d.error}` : ""}
              </p>
            </div>
            <Badge variant={STATUS_LABEL[d.status].variant}>{STATUS_LABEL[d.status].label}</Badge>
          </li>
        ))}
        {deliveries.length === 0 && <li className="p-6 text-center text-muted-foreground">Aún no hay envíos.</li>}
      </ul>
    </div>
  );
}
