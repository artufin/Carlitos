import type {
  DeliveryStore,
  PushPayload,
  PushSubscriptionRecord,
  PushTransport,
  SendSummary,
} from "@/lib/services/push/types";

export const GONE_STATUS_CODES = new Set([404, 410]);

export interface SendOptions {
  newsId: string;
  payload: PushPayload;
  subscriptions: PushSubscriptionRecord[];
  transport: PushTransport;
  store: DeliveryStore;
  /** Max in-flight sends. */
  concurrency: number;
}

/**
 * Sends `payload` to every subscription with bounded concurrency.
 * - Every attempt is recorded through `store.recordDelivery`.
 * - 404/410 answers delete the subscription (push service says it is gone).
 * - Never throws for a single failed recipient.
 */
export async function sendToSubscriptions(options: SendOptions): Promise<SendSummary> {
  const { newsId, payload, subscriptions, transport, store } = options;
  const concurrency = Math.max(1, options.concurrency);
  const summary: SendSummary = { sent: 0, failed: 0, gone: 0 };
  let cursor = 0;

  async function worker() {
    while (cursor < subscriptions.length) {
      const sub = subscriptions[cursor++];
      let result: Awaited<ReturnType<PushTransport["send"]>>;
      try {
        result = await transport.send(sub, payload);
      } catch (error) {
        result = { ok: false, error: error instanceof Error ? error.message : "unknown error" };
      }

      if (result.ok) {
        summary.sent++;
        await store.recordDelivery({ newsId, userId: sub.userId, subscriptionId: sub.id, status: "SENT", statusCode: result.statusCode });
        continue;
      }

      if (result.statusCode !== undefined && GONE_STATUS_CODES.has(result.statusCode)) {
        summary.gone++;
        await store.recordDelivery({
          newsId,
          userId: sub.userId,
          subscriptionId: sub.id,
          status: "GONE",
          statusCode: result.statusCode,
          error: result.error,
        });
        await store.deleteSubscription(sub.id);
        continue;
      }

      summary.failed++;
      await store.recordDelivery({
        newsId,
        userId: sub.userId,
        subscriptionId: sub.id,
        status: "FAILED",
        statusCode: result.statusCode,
        error: result.error.slice(0, 500),
      });
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, subscriptions.length) }, () => worker()));
  return summary;
}
