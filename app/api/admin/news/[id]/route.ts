import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { HttpError, parseJsonBody, withErrorHandling } from "@/lib/http";
import { getNewsById, updateNews } from "@/lib/services/news";
import { newsInputSchema } from "@/lib/validation/news";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const PUT = withErrorHandling(async (request: Request, { params }: Context) => {
  await requireAdmin(); // NOT IMPLEMENTED (MVP): open
  const { id } = await params;
  if (!(await getNewsById(id))) throw new HttpError(404, "Noticia no encontrada");
  const input = await parseJsonBody(request, newsInputSchema);
  const news = await updateNews(id, input);
  return NextResponse.json({ news: { id: news.id } });
});
