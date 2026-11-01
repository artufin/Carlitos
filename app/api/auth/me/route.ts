import { NextResponse } from "next/server";
import { toPublicAccount } from "@/lib/auth/auth-service";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/lib/http";
import { getSessionUserId } from "@/lib/session/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The logged-in account, or `null` for anonymous visitors. Never creates a device user. */
export const GET = withErrorHandling(async () => {
  const userId = await getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  return NextResponse.json({ account: user ? toPublicAccount(user) : null });
});
