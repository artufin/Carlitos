// Report domain service. NOT IMPLEMENTED (MVP): nothing calls this yet.
// The `/reportes` screen is a mock that keeps everything in memory. These
// functions are the real implementation surface for when the mock is wired
// to a route handler (`POST /api/reports`), so the schema, quota and
// classifier contracts are fixed now and do not change later.

import type { Report } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CHILE_TIME_ZONE } from "@/lib/format";
import { reportClassifier, type ReportClassifier } from "@/lib/services/reports/classifier";
import { DAILY_REPORT_LIMIT, type ReportInput } from "@/lib/services/reports/input";

export { reportClassificationSchema, parseClassification, REPORT_CLASS_CATEGORIES } from "@/lib/services/reports/classification";
export type { ReportClassification } from "@/lib/services/reports/classification";
export { UnavailableClassifier, reportClassifier } from "@/lib/services/reports/classifier";
export type { ReportClassifier } from "@/lib/services/reports/classifier";
export { DAILY_REPORT_LIMIT, reportInputSchema } from "@/lib/services/reports/input";
export type { ReportInput } from "@/lib/services/reports/input";

export interface QuotaResult {
  allowed: boolean;
  /** Reports already created today by this user. */
  usedToday: number;
  limit: number;
}

/**
 * NOT IMPLEMENTED (MVP): always allows.
 *
 * Final rule: at most DAILY_REPORT_LIMIT reports per user per calendar day in
 * America/Santiago, validated on the server with a clear message.
 * Implementation notes (see docs/DECISIONS.md):
 * - Count `Report` rows with `userId` and `createdAt >= startOfTodayInChile()`.
 * - Anonymous reports do not store `userId`, so to count them the quota must
 *   use a separate counter (e.g. a `ReportQuota` table keyed by userId+day) or
 *   a keyed hash of the user id stored on the report; otherwise anonymous
 *   reports would be unlimited.
 * - With the device session, clearing cookies bypasses the quota. Real
 *   enforcement depends on real auth.
 */
export async function checkReportQuota(userId: string | null): Promise<QuotaResult> {
  void userId;
  return { allowed: true, usedToday: 0, limit: DAILY_REPORT_LIMIT };
}

/** Start of the current day in Chile, for the future quota count. */
export function startOfTodayInChile(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  // Midnight in Chile expressed in UTC. Offset is derived by formatting again.
  const local = new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00Z`);
  const offsetMinutes = tzOffsetMinutes(local);
  return new Date(local.getTime() - offsetMinutes * 60_000);
}

function tzOffsetMinutes(date: Date): number {
  const chile = new Date(date.toLocaleString("en-US", { timeZone: CHILE_TIME_ZONE }));
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  return (chile.getTime() - utc.getTime()) / 60_000;
}

export class ReportQuotaExceededError extends Error {
  constructor(public readonly quota: QuotaResult) {
    super(`Máximo ${quota.limit} reportes por día`);
    this.name = "ReportQuotaExceededError";
  }
}

/**
 * NOT IMPLEMENTED (MVP): no route handler calls this.
 * Creates the report, classifies it (if a classifier is available) and
 * never fails because of the classifier.
 */
export async function createReport(
  input: ReportInput,
  userId: string | null,
  classifier: ReportClassifier = reportClassifier,
): Promise<Report> {
  // If anonymous, the user id is dropped before anything is stored.
  const ownerId = input.anonymous ? null : userId;

  const quota = await checkReportQuota(userId);
  if (!quota.allowed) throw new ReportQuotaExceededError(quota);

  // Only the text goes to the classifier: never ids or emails.
  const classification = await classifier.classify(input.text).catch(() => null);

  return prisma.report.create({
    data: {
      userId: ownerId,
      text: input.text,
      category: input.category || null,
      status: classification ? "RECEIVED" : "UNCLASSIFIED",
      classCategory: classification?.category ?? null,
      classPlace: classification?.place ?? null,
      classSeverity: classification?.severity ?? null,
      classSummary: classification?.summary ?? null,
      classMissingInfo: classification?.missingInfo ?? null,
      classifiedAt: classification ? new Date() : null,
    },
  });
}
