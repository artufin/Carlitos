// NOT IMPLEMENTED (MVP): mock catalogue and helpers for the payment flow.
// No bank, card network or payment processor is named: everything is generic
// and fictional. Replace with a real catalogue + processor when wiring /pagos.

import type {
  ExampleCard,
  ExampleTransferDetails,
  MockOrder,
  PaymentItem,
  PaymentItemKind,
  PaymentMethodId,
  PaymentMethodOption,
} from "@/lib/types/payment";

export const paymentKindLabel: Record<PaymentItemKind, string> = {
  cuota: "Cuotas",
  entrada: "Entradas",
  merch: "Merch",
};

export const paymentKindOrder: PaymentItemKind[] = ["cuota", "entrada", "merch"];

export const paymentItems: PaymentItem[] = [
  {
    id: "cuota-cai-2026",
    kind: "cuota",
    name: "Cuota CAi 2026",
    description: "Aporte anual que financia actividades, beneficios y materiales del centro de alumnos.",
    priceCLP: 5000,
    allowsQuantity: false,
    maxQuantity: 1,
  },
  {
    id: "cuota-semestral-2026-1",
    kind: "cuota",
    name: "Cuota semestral 2026-1",
    description: "Versión semestral de la cuota, para quienes prefieren pagar en dos partes.",
    priceCLP: 3000,
    allowsQuantity: false,
    maxQuantity: 1,
  },
  {
    id: "entrada-carrete-bienvenida",
    kind: "entrada",
    name: "Entrada carrete de bienvenida",
    description: "Incluye acceso al evento y una pulsera de ejemplo. Hasta 4 entradas por persona.",
    priceCLP: 4000,
    allowsQuantity: true,
    maxQuantity: 4,
  },
  {
    id: "entrada-fiesta-alianzas",
    kind: "entrada",
    name: "Entrada fiesta de alianzas",
    description: "Cierre de la semana de alianzas. Hasta 4 entradas por persona.",
    priceCLP: 6000,
    allowsQuantity: true,
    maxQuantity: 4,
  },
  {
    id: "merch-polera",
    kind: "merch",
    name: "Polera CAi",
    description: "Polera de algodón con diseño de la generación. Retiro en la oficina del CAi.",
    priceCLP: 12000,
    allowsQuantity: true,
    maxQuantity: 5,
  },
  {
    id: "merch-taza",
    kind: "merch",
    name: "Taza CAi",
    description: "Taza cerámica de 350 ml. Retiro en la oficina del CAi.",
    priceCLP: 6500,
    allowsQuantity: true,
    maxQuantity: 5,
  },
];

export const paymentMethods: PaymentMethodOption[] = [
  {
    id: "card",
    label: "Tarjeta de crédito / débito",
    description: "Pago en línea con tarjeta. En esta demo no se ingresan datos reales.",
  },
  {
    id: "transfer",
    label: "Transferencia",
    description: "Datos de una cuenta ficticia, solo para mostrar la pantalla.",
  },
];

export const paymentMethodLabel: Record<PaymentMethodId, string> = {
  card: "Tarjeta de crédito / débito",
  transfer: "Transferencia",
};

/** Fake card values. The number is masked on purpose and never editable. */
export const exampleCard: ExampleCard = {
  holder: "ESTUDIANTE DE EJEMPLO",
  maskedNumber: "•••• •••• •••• 1234",
  expiry: "12/29",
  maskedCvv: "•••",
};

/** Fake transfer details. "Banco de ejemplo" is not a real institution. */
export const exampleTransfer: ExampleTransferDetails = {
  bankLabel: "Banco de ejemplo",
  accountType: "Cuenta vista",
  accountNumber: "00 000 000 00",
  holder: "Centro de Alumnos (demo)",
  rut: "00.000.000-0",
  email: "pagos-demo@ejemplo.cl",
};

export function paymentItemById(id: string): PaymentItem | undefined {
  return paymentItems.find((item) => item.id === id);
}

/** Builds a fake order in memory. Nothing is charged or stored. */
export function createDemoOrder(item: PaymentItem, quantity: number, method: PaymentMethodId): MockOrder {
  const safeQuantity = Math.min(Math.max(1, quantity), item.allowsQuantity ? item.maxQuantity : 1);
  const number = Math.floor(100000 + Math.random() * 900000);
  return {
    id: `DEMO-${number}`,
    itemId: item.id,
    itemName: item.name,
    quantity: safeQuantity,
    unitPriceCLP: item.priceCLP,
    totalCLP: item.priceCLP * safeQuantity,
    method,
    createdAt: new Date().toISOString(),
    status: "demo",
  };
}
