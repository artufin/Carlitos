import { z } from "zod";

/** Shape of `PushSubscription.toJSON()` from the browser. */
export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().url().max(2048).refine((u) => u.startsWith("https://"), "El endpoint debe ser https"),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(10).max(512),
    auth: z.string().min(5).max(512),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;

export const unsubscribeInputSchema = z.object({
  endpoint: z.string().url().max(2048),
});
