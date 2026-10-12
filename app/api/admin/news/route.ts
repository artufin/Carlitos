import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { HttpError, parseJsonBody, withErrorHandling } from "@/lib/http";
import { createNews } from "@/lib/services/news";
import { getPushQueue, PushNotConfiguredError } from "@/lib/services/push/queue";
import { newsInputSchema } from "@/lib/validation/news";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withErrorHandling(async (request: Request) => {
  await requireAdmin(); // NOT IMPLEMENTED (MVP): open
  const input = await parseJsonBody(request, newsInputSchema);
  const news = await createNews(input);

  if (!input.notify) return NextResponse.json({ news: { id: news.id } }, { status: 201 });

  try {
    const push = await getPushQueue().enqueue(news.id);
    return NextResponse.json({ news: { id: news.id }, push }, { status: 201 });
  } catch (error) {
    if (error instanceof PushNotConfiguredError) {
      // The news is saved; only the notification could not be sent.
      throw new HttpError(503, "Noticia guardada, pero el push no está configurado (faltan claves VAPID)");
    }
    throw error;
  }
});
