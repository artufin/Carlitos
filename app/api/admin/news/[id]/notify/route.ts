import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { HttpError, withErrorHandling } from "@/lib/http";
import { getNewsById } from "@/lib/services/news";
import { getPushQueue, PushNotConfiguredError } from "@/lib/services/push/queue";

// Push is sent from the Node runtime (web-push needs Node crypto/http).
export const runtime = "nodejs";
// Vercel Hobby allows up to 60 s; InlineQueue caps recipients to fit.
export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(async (_request: Request, { params }: Context) => {
  await requireAdmin(); // NOT IMPLEMENTED (MVP): open
  const { id } = await params;
  if (!(await getNewsById(id))) throw new HttpError(404, "Noticia no encontrada");
  try {
    const push = await getPushQueue().enqueue(id);
    return NextResponse.json({ push });
  } catch (error) {
    if (error instanceof PushNotConfiguredError) throw new HttpError(503, "Push no configurado: faltan las claves VAPID");
    throw error;
  }
});
