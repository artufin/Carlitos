import type { News, Prisma, Topic, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recommender } from "@/lib/services/recommender";
import { getUserTopicIds } from "@/lib/services/topics";
import type { NewsInput } from "@/lib/validation/news";

export type NewsWithTopic = News & { topic: Topic };

const FEED_CANDIDATES = 100;

export async function getFeedForUser(user: User): Promise<{ news: NewsWithTopic[]; topicIds: string[] }> {
  const topicIds = await getUserTopicIds(user.id);
  const candidates = await prisma.news.findMany({
    where: { publishedAt: { lte: new Date() } },
    include: { topic: true },
    orderBy: { publishedAt: "desc" },
    take: FEED_CANDIDATES,
  });
  const news = await recommender.rank({ id: user.id, topicIds }, candidates);
  return { news, topicIds };
}

export async function getNewsById(id: string): Promise<NewsWithTopic | null> {
  return prisma.news.findUnique({ where: { id }, include: { topic: true } });
}

export async function listAllNews(): Promise<(NewsWithTopic & { _count: { deliveries: number; jobs: number } })[]> {
  return prisma.news.findMany({
    include: { topic: true, _count: { select: { deliveries: true, jobs: true } } },
    orderBy: { publishedAt: "desc" },
  });
}

export async function createNews(input: NewsInput): Promise<News> {
  return prisma.news.create({
    data: {
      title: input.title,
      summary: input.summary,
      body: input.body,
      topicId: input.topicId,
      notifyRequested: input.notify,
    },
  });
}

export async function updateNews(id: string, input: NewsInput): Promise<News> {
  const data: Prisma.NewsUpdateInput = {
    title: input.title,
    summary: input.summary,
    body: input.body,
    topic: { connect: { id: input.topicId } },
  };
  if (input.notify) data.notifyRequested = true;
  return prisma.news.update({ where: { id }, data });
}

export function newsPath(newsId: string): string {
  return `/noticias/${newsId}`;
}
