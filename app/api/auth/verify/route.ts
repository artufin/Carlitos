import { NextResponse } from "next/server";
import { toPublicAccount, verifyEmail } from "@/lib/auth/auth-service";
import { parseJsonBody, withErrorHandling } from "@/lib/http";
import { getCurrentUser, startSession } from "@/lib/session/user";
import { verifyInputSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: Request) => {
  const input = await parseJsonBody(request, verifyInputSchema);
  const account = await verifyEmail(input, await getCurrentUser());
  await startSession(account.id);
  return NextResponse.json({ account: toPublicAccount(account) });
});
