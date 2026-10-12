import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { HttpError, parseJsonBody, withErrorHandling } from "@/lib/http";
import { getNewsById, updateNews } from "@/lib/services/news";
import { getPushQueue, PushNotConfiguredError } from "@/lib/services/push/queue";
import { newsInputSchema } from "@/lib/validation/news";

export const runtime = "nodejs";
export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

export const PUT = withErrorHandling(async (request: Request, { params }: Context) => {
  await requireAdmin(); // NOT IMPLEMENTED (MVP): open
  const { id } = await params;
  if (!(await getNewsById(id))) throw new HttpError(404, "Noticia no encontrada");
  const input = await parseJsonBody(request, newsInputSchema);
  const news = await updateNews(id, input);

  if (!input.notify) return NextResponse.json({ news: { id: news.id } });

  try {
    const push = await getPushQueue().enqueue(news.id);
    return NextResponse.json({ news: { id: news.id }, push });
  } catch (error) {
    if (error instanceof PushNotConfiguredError) {
      throw new HttpError(503, "Cambios guardados, pero el push no está configurado (faltan claves VAPID)");
    }
    throw error;
  }
});
