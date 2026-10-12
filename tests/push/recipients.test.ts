import { describe, expect, it } from "vitest";
import { selectRecipients } from "@/lib/services/push/recipients";
import type { PushCandidate } from "@/lib/services/push/types";

function sub(id: string, userId: string, endpoint = `https://push.example/${id}`) {
  return { id, userId, endpoint, p256dh: "p", auth: "a" };
}

const candidates: PushCandidate[] = [
  { userId: "u-b", topicIds: ["academico"], subscriptions: [sub("s2", "u-b"), sub("s1", "u-b")] },
  { userId: "u-a", topicIds: ["academico", "deportes"], subscriptions: [sub("s3", "u-a")] },
  { userId: "u-c", topicIds: ["deportes"], subscriptions: [sub("s4", "u-c")] },
  { userId: "u-d", topicIds: ["academico"], subscriptions: [] },
];

describe("selectRecipients", () => {
  it("returns every subscription of users following the news topic", () => {
    const result = selectRecipients({ topicId: "academico" }, candidates);
    expect(result.map((s) => s.id)).toEqual(["s3", "s1", "s2"]);
  });

  it("excludes users who do not follow the topic", () => {
    const result = selectRecipients({ topicId: "deportes" }, candidates);
    expect(result.map((s) => s.userId)).toEqual(["u-a", "u-c"]);
  });

  it("returns an empty list when nobody follows the topic", () => {
    expect(selectRecipients({ topicId: "cultura" }, candidates)).toEqual([]);
  });

  it("deduplicates endpoints", () => {
    const dup: PushCandidate[] = [
      { userId: "u-1", topicIds: ["t"], subscriptions: [sub("a", "u-1", "https://push.example/same")] },
      { userId: "u-2", topicIds: ["t"], subscriptions: [sub("b", "u-2", "https://push.example/same")] },
    ];
    expect(selectRecipients({ topicId: "t" }, dup)).toHaveLength(1);
  });
});
