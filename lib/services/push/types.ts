// Shared types for the push pipeline. Kept free of Prisma/HTTP so the pure
// parts (recipient selection, batch sending) are unit-testable with fakes.

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** A user who may receive pushes: the topics they follow and their devices. */
export interface PushCandidate {
  userId: string;
  topicIds: string[];
  subscriptions: PushSubscriptionRecord[];
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
  icon?: string;
}

export type TransportResult = { ok: true; statusCode?: number } | { ok: false; statusCode?: number; error: string };

export interface PushTransport {
  send(subscription: PushSubscriptionRecord, payload: PushPayload): Promise<TransportResult>;
}

export type DeliveryStatus = "SENT" | "FAILED" | "GONE";

export interface DeliveryRecord {
  newsId: string;
  userId: string;
  subscriptionId: string;
  status: DeliveryStatus;
  statusCode?: number;
  error?: string;
}

export interface DeliveryStore {
  recordDelivery(delivery: DeliveryRecord): Promise<void>;
  /** Called for 404/410 responses: the subscription is dead. */
  deleteSubscription(subscriptionId: string): Promise<void>;
}

export interface SendSummary {
  sent: number;
  failed: number;
  gone: number;
}

/** Result of one `PushQueue.enqueue` invocation. */
export interface EnqueueResult extends SendSummary {
  recipients: number;
  /** Recipients beyond the per-invocation cap, recorded as pending jobs. */
  queued: number;
}

export interface QueueStatus extends SendSummary {
  pending: number;
}

/**
 * NOT IMPLEMENTED (MVP): a real asynchronous queue. The MVP ships
 * `InlineQueue`, which sends synchronously within the request (bounded by
 * concurrency and a recipients cap) and records the overflow as
 * `NotificationJob` rows. See docs/DECISIONS.md -> "Cola de envíos".
 */
export interface PushQueue {
  enqueue(newsId: string): Promise<EnqueueResult>;
  status(newsId: string): Promise<QueueStatus>;
}
