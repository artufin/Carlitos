// NOT IMPLEMENTED (MVP): shapes used by the mock report views. They mirror
// the Prisma `Report` model and `ReportClassification` so the mock can be
// replaced by real data without changing the components.

import type { ReportClassification } from "@/lib/services/reports/classification";

export type MockReportStatus = "received" | "in_review" | "resolved";

export interface ReportCategoryOption {
  slug: string;
  label: string;
}

export interface MockReport {
  id: string;
  text: string;
  /** Category chosen by the student, if any. */
  category: string | null;
  anonymous: boolean;
  status: MockReportStatus;
  createdAt: string; // ISO
  /** Example classification (the real one is produced by the LLM later). */
  classification: ReportClassification | null;
}
