// NOT IMPLEMENTED (MVP): shapes for the mock payment flow (/pagos). They are
// designed to become Prisma models (PaymentItem, Order) once a real payment
// processor is wired. Nothing here is charged or persisted.

export type PaymentItemKind = "cuota" | "entrada" | "merch";

export interface PaymentItem {
  id: string;
  kind: PaymentItemKind;
  name: string;
  description: string;
  /** Unit price in Chilean pesos (integer, no decimals). */
  priceCLP: number;
  /** Whether more than one unit can be bought (entradas, merch). */
  allowsQuantity: boolean;
  /** Upper bound for the quantity selector. */
  maxQuantity: number;
}

export type PaymentMethodId = "card" | "transfer";

export interface PaymentMethodOption {
  id: PaymentMethodId;
  label: string;
  description: string;
}

/** Example (fake) card shown as a static illustration. Never editable. */
export interface ExampleCard {
  holder: string;
  maskedNumber: string;
  expiry: string;
  maskedCvv: string;
}

/** Example (fake) transfer details shown as disabled fields. */
export interface ExampleTransferDetails {
  bankLabel: string;
  accountType: string;
  accountNumber: string;
  holder: string;
  rut: string;
  email: string;
}

export type PaymentStep = "item" | "summary" | "method" | "receipt";

export interface MockOrder {
  /** Fake order number, e.g. "DEMO-482913". */
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPriceCLP: number;
  totalCLP: number;
  method: PaymentMethodId;
  createdAt: string; // ISO
  /** Always "demo": the receipt has no validity. */
  status: "demo";
}
