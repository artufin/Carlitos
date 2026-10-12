import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { AdminForbiddenError } from "@/lib/auth/admin";
import { SessionMissingError } from "@/lib/session/user";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function jsonError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

/** Parses and validates a JSON body. Throws HttpError(400) on invalid input. */
export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new HttpError(400, "Cuerpo JSON inválido");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "Datos inválidos", parsed.error.flatten());
  }
  return parsed.data;
}

/**
 * Wraps a route handler so domain errors map to HTTP responses without
 * leaking stack traces. Unknown errors become a 500 with a generic message.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) return jsonError(error.status, error.message, error.details);
      if (error instanceof SessionMissingError) return jsonError(401, "Sin sesión de dispositivo");
      if (error instanceof AdminForbiddenError) return jsonError(403, "Acceso de administrador requerido");
      console.error("[api] unhandled error", error instanceof Error ? error.message : error);
      return jsonError(500, "Error interno");
    }
  };
}
