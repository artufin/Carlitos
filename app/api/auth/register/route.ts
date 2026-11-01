import { NextResponse } from "next/server";
import { registerAccount } from "@/lib/auth/auth-service";
import { parseJsonBody, withErrorHandling } from "@/lib/http";
import { registerInputSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

/** Creates the account and emails a code. The session starts at /api/auth/verify. */
export const POST = withErrorHandling(async (request: Request) => {
  const input = await parseJsonBody(request, registerInputSchema);
  await registerAccount(input);
  return NextResponse.json({ verificationRequired: true }, { status: 201 });
});
