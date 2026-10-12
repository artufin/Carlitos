// Client-safe part of the report service (no Prisma import): the input
// schema and the production quota constant, shared by the mock form.

import { z } from "zod";

/** Production rule: max reports per user per day (Chile time). Not enforced in the MVP. */
export const DAILY_REPORT_LIMIT = 2;

export const reportInputSchema = z.object({
  text: z.string().trim().min(20, "Cuéntanos un poco más (mínimo 20 caracteres)").max(2000, "Máximo 2.000 caracteres"),
  category: z.string().trim().max(50).optional(),
  anonymous: z.boolean().default(false),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
