import type { PushCandidate, PushSubscriptionRecord } from "@/lib/services/push/types";

/**
 * Recipients of a news item = every push subscription of users who follow
 * the news topic. Pure function (unit-tested); deterministic order by
 * userId then subscription id so batching is stable across invocations.
 */
export function selectRecipients(news: { topicId: string }, candidates: PushCandidate[]): PushSubscriptionRecord[] {
  const seenEndpoints = new Set<string>();
  const result: PushSubscriptionRecord[] = [];
  const sorted = [...candidates].sort((a, b) => a.userId.localeCompare(b.userId));
  for (const candidate of sorted) {
    if (!candidate.topicIds.includes(news.topicId)) continue;
    const subs = [...candidate.subscriptions].sort((a, b) => a.id.localeCompare(b.id));
    for (const sub of subs) {
      if (seenEndpoints.has(sub.endpoint)) continue;
      seenEndpoints.add(sub.endpoint);
      result.push(sub);
    }
  }
  return result;
}
