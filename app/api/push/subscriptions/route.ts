import { NextResponse } from "next/server";
import { parseJsonBody, withErrorHandling } from "@/lib/http";
import { removeSubscription, saveSubscription } from "@/lib/services/push/subscriptions";
import { requireUser } from "@/lib/session/user";
import { pushSubscriptionInputSchema, unsubscribeInputSchema } from "@/lib/validation/push";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, pushSubscriptionInputSchema);
  const result = await saveSubscription(user.id, input, request.headers.get("user-agent"));
  return NextResponse.json({ id: result.id }, { status: 201 });
});

export const DELETE = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = await parseJsonBody(request, unsubscribeInputSchema);
  const removed = await removeSubscription(user.id, input.endpoint);
  return NextResponse.json({ removed });
});
