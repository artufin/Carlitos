import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { jsonError, withErrorHandling } from "@/lib/http";

// NOT IMPLEMENTED (MVP): scheduled digest.
//
// Design: once a day, send each subscribed user a single push summarizing the
// news published in their topics since the last digest (instead of one push
// per news). Protected by CRON_SECRET. It is intentionally NOT declared in
// vercel.json: on the Hobby plan cron runs at most once a day and the demo
// does not need it yet. To enable: add { "crons": [{ "path": "/api/cron/digest",
// "schedule": "0 12 * * *" }] } to vercel.json and set CRON_SECRET (Vercel
// sends it as `Authorization: Bearer <CRON_SECRET>`).

export const runtime = "nodejs";
export const maxDuration = 60;

export const GET = withErrorHandling(async (request: Request) => {
  const secret = getEnv().CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || header !== `Bearer ${secret}`) {
    return jsonError(401, "No autorizado");
  }
  return NextResponse.json({ ok: true, implemented: false, message: "Digest no implementado en el MVP" });
});
