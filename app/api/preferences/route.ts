import { NextResponse } from "next/server";
import { parseJsonBody, withErrorHandling } from "@/lib/http";
import { getUserTopicIds, setUserTopics } from "@/lib/services/topics";
import { requireUser } from "@/lib/session/user";
import { preferencesInputSchema } from "@/lib/validation/news";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const topicIds = await getUserTopicIds(user.id);
  return NextResponse.json({ topicIds });
});

export const PUT = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, preferencesInputSchema);
  const topicIds = await setUserTopics(user.id, input.topicIds);
  return NextResponse.json({ topicIds });
});
