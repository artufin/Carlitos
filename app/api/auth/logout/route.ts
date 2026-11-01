import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/http";
import { endSession, rotateDeviceId } from "@/lib/session/user";

export const runtime = "nodejs";

export const POST = withErrorHandling(async () => {
  await endSession();
  // A fresh anonymous device, so the browser does not keep the account's data.
  await rotateDeviceId();
  return NextResponse.json({ ok: true });
});
