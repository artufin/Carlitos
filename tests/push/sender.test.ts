import { describe, expect, it } from "vitest";
import { sendToSubscriptions } from "@/lib/services/push/sender";
import type { DeliveryRecord, DeliveryStore, PushSubscriptionRecord, PushTransport } from "@/lib/services/push/types";

const payload = { title: "t", body: "b", url: "https://app.example/noticias/1" };

function sub(id: string): PushSubscriptionRecord {
  return { id, userId: `user-${id}`, endpoint: `https://push.example/${id}`, p256dh: "p", auth: "a" };
}

function fakeStore() {
  const deliveries: DeliveryRecord[] = [];
  const deleted: string[] = [];
  const store: DeliveryStore = {
    async recordDelivery(d) {
      deliveries.push(d);
    },
    async deleteSubscription(id) {
      deleted.push(id);
    },
  };
  return { store, deliveries, deleted };
}

describe("sendToSubscriptions", () => {
  it("deletes subscriptions that answer 404 or 410 and records them as GONE", async () => {
    const codes: Record<string, number> = { a: 201, b: 410, c: 404, d: 500 };
    const transport: PushTransport = {
      async send(s) {
        const code = codes[s.id];
        return code < 300 ? { ok: true, statusCode: code } : { ok: false, statusCode: code, error: `push service ${code}` };
      },
    };
    const { store, deliveries, deleted } = fakeStore();

    const summary = await sendToSubscriptions({
      newsId: "n1",
      payload,
      subscriptions: ["a", "b", "c", "d"].map(sub),
      transport,
      store,
      concurrency: 2,
    });

    expect(summary).toEqual({ sent: 1, failed: 1, gone: 2 });
    expect(deleted.sort()).toEqual(["b", "c"]);
    expect(deliveries).toHaveLength(4);
    expect(deliveries.find((d) => d.subscriptionId === "b")?.status).toBe("GONE");
    expect(deliveries.find((d) => d.subscriptionId === "d")?.status).toBe("FAILED");
    expect(deliveries.find((d) => d.subscriptionId === "a")?.status).toBe("SENT");
  });

  it("records thrown transport errors as FAILED without aborting the batch", async () => {
    const transport: PushTransport = {
      async send(s) {
        if (s.id === "boom") throw new Error("network down");
        return { ok: true, statusCode: 201 };
      },
    };
    const { store, deliveries, deleted } = fakeStore();
    const summary = await sendToSubscriptions({
      newsId: "n1",
      payload,
      subscriptions: ["ok1", "boom", "ok2"].map(sub),
      transport,
      store,
      concurrency: 10,
    });
    expect(summary).toEqual({ sent: 2, failed: 1, gone: 0 });
    expect(deleted).toEqual([]);
    expect(deliveries.find((d) => d.subscriptionId === "boom")?.error).toBe("network down");
  });

  it("never exceeds the configured concurrency", async () => {
    let inFlight = 0;
    let peak = 0;
    const transport: PushTransport = {
      async send() {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
        return { ok: true };
      },
    };
    const { store } = fakeStore();
    await sendToSubscriptions({
      newsId: "n1",
      payload,
      subscriptions: Array.from({ length: 12 }, (_, i) => sub(`s${i}`)),
      transport,
      store,
      concurrency: 3,
    });
    expect(peak).toBeLessThanOrEqual(3);
  });
});
