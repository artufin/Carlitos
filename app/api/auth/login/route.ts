import { NextResponse } from "next/server";
import { loginAccount, toPublicAccount } from "@/lib/auth/auth-service";
import { parseJsonBody, withErrorHandling } from "@/lib/http";
import { getCurrentUser, startSession } from "@/lib/session/user";
import { loginInputSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: Request) => {
  const input = await parseJsonBody(request, loginInputSchema);
  const account = await loginAccount(input, await getCurrentUser());
  await startSession(account.id);
  return NextResponse.json({ account: toPublicAccount(account) });
});
