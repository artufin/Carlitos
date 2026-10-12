// Node-only transport built on the `web-push` library (VAPID).
// Must never be imported from Edge runtime code.

import webpush, { WebPushError } from "web-push";
import { getEnv } from "@/lib/env";
import type { PushPayload, PushSubscriptionRecord, PushTransport, TransportResult } from "@/lib/services/push/types";

const TTL_SECONDS = 24 * 60 * 60;

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const env = getEnv();
  if (!env.VAPID_PRIVATE_KEY || !env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    throw new Error("VAPID keys are not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)");
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  configured = true;
}

export class WebPushTransport implements PushTransport {
  async send(subscription: PushSubscriptionRecord, payload: PushPayload): Promise<TransportResult> {
    ensureConfigured();
    try {
      const response = await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(payload),
        { TTL: TTL_SECONDS, urgency: "normal" },
      );
      return { ok: true, statusCode: response.statusCode };
    } catch (error) {
      if (error instanceof WebPushError) {
        // Do not log the endpoint or body: they identify the device.
        return { ok: false, statusCode: error.statusCode, error: `push service ${error.statusCode}` };
      }
      return { ok: false, error: error instanceof Error ? error.message : "unknown error" };
    }
  }
}
