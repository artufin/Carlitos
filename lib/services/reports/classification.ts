import { z } from "zod";

/**
 * Output contract of the report classifier. This is the ONLY shape the app
 * accepts from an LLM: anything that does not validate is discarded and the
 * report stays "sin clasificar".
 */
export const REPORT_CLASS_CATEGORIES = [
  "infraestructura",
  "carga-academica",
  "convivencia",
  "seguridad",
  "servicios",
  "otro",
] as const;

export type ReportClassCategory = (typeof REPORT_CLASS_CATEGORIES)[number];

export const reportClassificationSchema = z.object({
  category: z.enum(REPORT_CLASS_CATEGORIES),
  /** Place mentioned in the report, or null when none can be inferred. */
  place: z.string().trim().min(1).max(120).nullable(),
  /** 1 = low, 2 = medium, 3 = high. */
  severity: z.number().int().min(1).max(3),
  /** One-line summary for the admin list. */
  summary: z.string().trim().min(1).max(200),
  /** True when the report lacks information needed to act on it. */
  missingInfo: z.boolean(),
});

export type ReportClassification = z.infer<typeof reportClassificationSchema>;

/**
 * Parses raw model output. Returns null for anything invalid (never throws),
 * so a bad model answer degrades to "sin clasificar" instead of failing the
 * report creation.
 */
export function parseClassification(raw: unknown): ReportClassification | null {
  const parsed = reportClassificationSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
