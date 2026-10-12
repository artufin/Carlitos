import { prisma } from "@/lib/db";

const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Records one impression per user/news per 24 h. Cheap enough for the MVP;
 * a real implementation would batch this client-side.
 */
export async function recordImpressions(userId: string, newsIds: string[]): Promise<void> {
  if (newsIds.length === 0) return;
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const recent = await prisma.interaction.findMany({
    where: { userId, type: "IMPRESSION", newsId: { in: newsIds }, createdAt: { gte: since } },
    select: { newsId: true },
  });
  const seen = new Set(recent.map((r) => r.newsId));
  const fresh = newsIds.filter((id) => !seen.has(id));
  if (fresh.length === 0) return;
  await prisma.interaction.createMany({
    data: fresh.map((newsId) => ({ userId, newsId, type: "IMPRESSION" })),
  });
}

export async function recordClick(userId: string, newsId: string): Promise<void> {
  await prisma.interaction.create({ data: { userId, newsId, type: "CLICK" } });
}
