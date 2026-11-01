import { NextResponse } from "next/server";
import { resendCode } from "@/lib/auth/auth-service";
import { parseJsonBody, withErrorHandling } from "@/lib/http";
import { resendInputSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";

/** Always answers 200 so it does not reveal which emails have pending accounts. */
export const POST = withErrorHandling(async (request: Request) => {
  const { email } = await parseJsonBody(request, resendInputSchema);
  return NextResponse.json(await resendCode(email));
});
