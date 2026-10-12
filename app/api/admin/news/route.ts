import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { parseJsonBody, withErrorHandling } from "@/lib/http";
import { createNews } from "@/lib/services/news";
import { newsInputSchema } from "@/lib/validation/news";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: Request) => {
  await requireAdmin(); // NOT IMPLEMENTED (MVP): open
  const input = await parseJsonBody(request, newsInputSchema);
  const news = await createNews(input);
  return NextResponse.json({ news: { id: news.id } }, { status: 201 });
});
