// NOT IMPLEMENTED (MVP): shapes used by the mock loans view. Designed to
// become Prisma models (`LoanItem`, `LoanRequest`, `PickupPlace`).

export type LoanItemStatus = "available" | "borrowed" | "reserved";

export type LoanItemKind = "calculator" | "apron" | "padlock" | "charger" | "adapter" | "kit";

export interface LoanItem {
  id: string;
  name: string;
  kind: LoanItemKind;
  description: string;
  status: LoanItemStatus;
  /** Expected return date (YYYY-MM-DD) when borrowed/reserved. */
  dueDate: string | null;
}

export interface PickupPlace {
  id: string;
  label: string;
}

export type LoanRequestStatus = "pending" | "approved" | "returned";

export interface LoanRequest {
  id: string;
  itemId: string;
  pickupDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  pickupPlaceId: string;
  status: LoanRequestStatus;
  createdAt: string; // ISO
}
