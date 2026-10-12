import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/http";
import type { PushSubscriptionInput } from "@/lib/validation/push";

/** Rate limit: subscription writes per user per hour. */
const MAX_WRITES_PER_HOUR = 20;
/** Max devices per user; the oldest are dropped beyond this. */
const MAX_ACTIVE_PER_USER = 10;

export async function saveSubscription(userId: string, input: PushSubscriptionInput, userAgent: string | null) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentWrites = await prisma.pushSubscription.count({ where: { userId, createdAt: { gte: since } } });
  if (recentWrites >= MAX_WRITES_PER_HOUR) {
    throw new HttpError(429, "Demasiadas suscripciones en poco tiempo. Inténtalo más tarde.");
  }

  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    update: { userId, p256dh: input.keys.p256dh, auth: input.keys.auth, userAgent: userAgent?.slice(0, 255) ?? null, lastUsedAt: new Date() },
    create: {
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: userAgent?.slice(0, 255) ?? null,
    },
  });

  const extra = await prisma.pushSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: MAX_ACTIVE_PER_USER,
    select: { id: true },
  });
  if (extra.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: extra.map((e) => e.id) } } });
  }

  return { id: subscription.id };
}

export async function removeSubscription(userId: string, endpoint: string): Promise<boolean> {
  const result = await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  return result.count > 0;
}

export async function hasSubscription(userId: string, endpoint: string): Promise<boolean> {
  const count = await prisma.pushSubscription.count({ where: { userId, endpoint } });
  return count > 0;
}
