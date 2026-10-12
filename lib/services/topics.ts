import type { Topic } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listTopics(): Promise<Topic[]> {
  return prisma.topic.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

export async function getUserTopicIds(userId: string): Promise<string[]> {
  const rows = await prisma.userTopic.findMany({ where: { userId }, select: { topicId: true } });
  return rows.map((r) => r.topicId);
}

/** Replaces the user's topic selection. Unknown topic ids are ignored. */
export async function setUserTopics(userId: string, topicIds: string[]): Promise<string[]> {
  const valid = await prisma.topic.findMany({
    where: { id: { in: topicIds }, active: true },
    select: { id: true },
  });
  const ids = valid.map((t) => t.id);
  await prisma.$transaction([
    prisma.userTopic.deleteMany({ where: { userId } }),
    prisma.userTopic.createMany({ data: ids.map((topicId) => ({ userId, topicId })) }),
  ]);
  return ids;
}
