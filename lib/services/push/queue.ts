import { prisma } from "@/lib/db";
import { getAppUrl, getEnv, isPushConfigured } from "@/lib/env";
import { newsPath } from "@/lib/services/news";
import { selectRecipients } from "@/lib/services/push/recipients";
import { sendToSubscriptions } from "@/lib/services/push/sender";
import type {
  DeliveryStore,
  EnqueueResult,
  PushCandidate,
  PushPayload,
  PushQueue,
  PushTransport,
  QueueStatus,
} from "@/lib/services/push/types";
import { WebPushTransport } from "@/lib/services/push/web-push-transport";

export class PushNotConfiguredError extends Error {
  constructor() {
    super("Push is not configured: missing VAPID keys");
    this.name = "PushNotConfiguredError";
  }
}

const prismaDeliveryStore: DeliveryStore = {
  async recordDelivery(d) {
    await prisma.pushDelivery.create({
      data: {
        newsId: d.newsId,
        userId: d.userId,
        subscriptionId: d.subscriptionId,
        status: d.status,
        statusCode: d.statusCode,
        error: d.error,
      },
    });
  },
  async deleteSubscription(id) {
    await prisma.pushSubscription.deleteMany({ where: { id } });
  },
};

export function buildPayload(news: { id: string; title: string; summary: string }): PushPayload {
  return {
    title: news.title,
    body: news.summary,
    url: `${getAppUrl()}${newsPath(news.id)}?src=push`,
    tag: `news-${news.id}`,
    icon: "/icons/icon-192.png",
  };
}

async function loadCandidates(): Promise<PushCandidate[]> {
  const users = await prisma.user.findMany({
    where: { subscriptions: { some: {} } },
    select: {
      id: true,
      topics: { select: { topicId: true } },
      subscriptions: { select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true } },
    },
  });
  return users.map((u) => ({ userId: u.id, topicIds: u.topics.map((t) => t.topicId), subscriptions: u.subscriptions }));
}

/**
 * MVP queue: sends inline, within the request, with bounded concurrency and a
 * cap on recipients per invocation (to respect Vercel's maxDuration). The
 * overflow is recorded as PENDING `NotificationJob`s; pressing "send" again
 * drains them. A real worker (BullMQ, or a serverless queue) would implement
 * the same `PushQueue` interface without touching callers.
 */
export class InlineQueue implements PushQueue {
  constructor(
    private readonly transport: PushTransport,
    private readonly store: DeliveryStore,
    private readonly limits: { concurrency: number; maxRecipientsPerInvocation: number },
  ) {}

  async enqueue(newsId: string): Promise<EnqueueResult> {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) throw new Error("News not found");

    const candidates = await loadCandidates();
    const recipients = selectRecipients(news, candidates);
    const batch = recipients.slice(0, this.limits.maxRecipientsPerInvocation);
    const overflow = recipients.slice(this.limits.maxRecipientsPerInvocation);

    const summary = await sendToSubscriptions({
      newsId,
      payload: buildPayload(news),
      subscriptions: batch,
      transport: this.transport,
      store: this.store,
      concurrency: this.limits.concurrency,
    });

    const sentUserIds = [...new Set(batch.map((s) => s.userId))];
    const overflowUserIds = [...new Set(overflow.map((s) => s.userId))].filter((id) => !sentUserIds.includes(id));

    await prisma.$transaction([
      prisma.notificationJob.updateMany({
        where: { newsId, userId: { in: sentUserIds }, status: "PENDING" },
        data: { status: "SENT", attempts: { increment: 1 } },
      }),
      prisma.notificationJob.createMany({
        data: overflowUserIds.map((userId) => ({ userId, newsId, status: "PENDING" })),
        skipDuplicates: true,
      }),
      prisma.news.update({ where: { id: newsId }, data: { notifiedAt: new Date(), notifyRequested: true } }),
    ]);

    console.info(`[push] news=${newsId} recipients=${recipients.length} sent=${summary.sent} failed=${summary.failed} gone=${summary.gone} queued=${overflowUserIds.length}`);

    return { ...summary, recipients: recipients.length, queued: overflowUserIds.length };
  }

  async status(newsId: string): Promise<QueueStatus> {
    return getPushStatusForNews(newsId);
  }
}

export async function getPushStatusForNews(newsId: string): Promise<QueueStatus> {
  const [deliveries, pending] = await Promise.all([
    prisma.pushDelivery.groupBy({ by: ["status"], where: { newsId }, _count: { _all: true } }),
    prisma.notificationJob.count({ where: { newsId, status: "PENDING" } }),
  ]);
  const count = (status: "SENT" | "FAILED" | "GONE") => deliveries.find((d) => d.status === status)?._count._all ?? 0;
  return { sent: count("SENT"), failed: count("FAILED"), gone: count("GONE"), pending };
}

let queue: PushQueue | null = null;

/** Returns the process-wide queue. Throws if VAPID keys are missing. */
export function getPushQueue(): PushQueue {
  if (!isPushConfigured()) throw new PushNotConfiguredError();
  if (!queue) {
    const env = getEnv();
    queue = new InlineQueue(new WebPushTransport(), prismaDeliveryStore, {
      concurrency: env.PUSH_CONCURRENCY,
      maxRecipientsPerInvocation: env.PUSH_MAX_RECIPIENTS_PER_INVOCATION,
    });
  }
  return queue;
}
