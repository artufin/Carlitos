// NOT IMPLEMENTED (MVP): mock catalog and requests for the loans view. All
// edits happen in memory and are lost on reload.

import type { LoanItem, LoanItemStatus, LoanRequest, LoanRequestStatus, PickupPlace } from "@/lib/types/loan";

export const loanItemStatusLabel: Record<LoanItemStatus, string> = {
  available: "Disponible",
  borrowed: "Prestado",
  reserved: "Reservado",
};

export const loanRequestStatusLabel: Record<LoanRequestStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  returned: "Devuelta",
};

export const pickupPlaces: PickupPlace[] = [
  { id: "oficina-cai", label: "Oficina del CAi" },
  { id: "meson-biblioteca", label: "Mesón de la biblioteca" },
  { id: "sala-estudio-2", label: "Sala de estudio, piso 2" },
];

/** YYYY-MM-DD in local time, `offsetDays` from today. */
export function dateInputValue(offsetDays = 0, base: Date = new Date()): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const mockLoanItems: LoanItem[] = [
  {
    id: "item-001",
    name: "Calculadora científica",
    kind: "calculator",
    description: "Modelo estándar permitido en pruebas. Incluye funda.",
    status: "available",
    dueDate: null,
  },
  {
    id: "item-002",
    name: "Calculadora científica (2)",
    kind: "calculator",
    description: "Segunda unidad, mismo modelo.",
    status: "borrowed",
    dueDate: dateInputValue(4),
  },
  {
    id: "item-003",
    name: "Calculadora gráfica",
    kind: "calculator",
    description: "Para ramos de cálculo avanzado. Pide con anticipación.",
    status: "reserved",
    dueDate: dateInputValue(7),
  },
  {
    id: "item-004",
    name: "Delantal de laboratorio",
    kind: "apron",
    description: "Talla única, algodón blanco. Devolver limpio.",
    status: "available",
    dueDate: null,
  },
  {
    id: "item-005",
    name: "Candado para locker",
    kind: "padlock",
    description: "Candado de combinación. La clave se entrega al retirar.",
    status: "available",
    dueDate: null,
  },
  {
    id: "item-006",
    name: "Cargador USB-C 65 W",
    kind: "charger",
    description: "Sirve para la mayoría de los notebooks. Cable incluido.",
    status: "borrowed",
    dueDate: dateInputValue(1),
  },
  {
    id: "item-007",
    name: "Adaptador HDMI",
    kind: "adapter",
    description: "USB-C a HDMI para presentaciones en sala.",
    status: "available",
    dueDate: null,
  },
  {
    id: "item-008",
    name: "Kit de dibujo técnico",
    kind: "kit",
    description: "Escuadras, regla T y compás. Solo para uso en campus.",
    status: "reserved",
    dueDate: dateInputValue(3),
  },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const mockLoanRequests: LoanRequest[] = [
  {
    id: "req-001",
    itemId: "item-006",
    pickupDate: dateInputValue(-2),
    returnDate: dateInputValue(1),
    pickupPlaceId: "oficina-cai",
    status: "approved",
    createdAt: daysAgo(3),
  },
  {
    id: "req-002",
    itemId: "item-008",
    pickupDate: dateInputValue(2),
    returnDate: dateInputValue(3),
    pickupPlaceId: "meson-biblioteca",
    status: "pending",
    createdAt: daysAgo(1),
  },
  {
    id: "req-003",
    itemId: "item-004",
    pickupDate: dateInputValue(-14),
    returnDate: dateInputValue(-10),
    pickupPlaceId: "oficina-cai",
    status: "returned",
    createdAt: daysAgo(16),
  },
];
