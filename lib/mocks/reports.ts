// NOT IMPLEMENTED (MVP): mock data for the report views. No real people or
// risky places are mentioned. Replace with lib/services/reports when wiring
// the real feature.

import type { MockReport, MockReportStatus, ReportCategoryOption } from "@/lib/types/report";
import type { ReportClassification } from "@/lib/services/reports/classification";

export const reportCategories: ReportCategoryOption[] = [
  { slug: "infraestructura", label: "Infraestructura (salas, baños, luz)" },
  { slug: "carga-academica", label: "Carga académica" },
  { slug: "convivencia", label: "Convivencia" },
  { slug: "servicios", label: "Servicios (casino, bibliotecas, wifi)" },
  { slug: "seguridad", label: "Seguridad" },
  { slug: "otro", label: "Otro" },
];

export const reportStatusLabel: Record<MockReportStatus, string> = {
  received: "Recibido",
  in_review: "En revisión",
  resolved: "Resuelto",
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const mockReports: MockReport[] = [
  {
    id: "rep-001",
    text: "En la sala B-21 hay tres enchufes que no funcionan y en las tardes la sala queda llena de gente buscando dónde cargar el notebook.",
    category: "infraestructura",
    anonymous: false,
    status: "in_review",
    createdAt: daysAgo(2),
    classification: {
      category: "infraestructura",
      place: "Sala B-21",
      severity: 2,
      summary: "Enchufes sin funcionar en sala B-21",
      missingInfo: false,
    },
  },
  {
    id: "rep-002",
    text: "Esta semana tenemos tres controles y una entrega el mismo día jueves. Sería bueno coordinar fechas entre los cursos de segundo semestre.",
    category: "carga-academica",
    anonymous: true,
    status: "received",
    createdAt: daysAgo(1),
    classification: {
      category: "carga-academica",
      place: null,
      severity: 2,
      summary: "Tres controles y una entrega el mismo día",
      missingInfo: true,
    },
  },
  {
    id: "rep-003",
    text: "El wifi en el patio central se cae todos los días cerca de la 1 pm. Ya lo reporté a la mesa de ayuda pero sigue igual.",
    category: "servicios",
    anonymous: false,
    status: "resolved",
    createdAt: daysAgo(6),
    classification: {
      category: "servicios",
      place: "Patio central",
      severity: 1,
      summary: "Wifi inestable en el patio central al mediodía",
      missingInfo: false,
    },
  },
  {
    id: "rep-004",
    text: "La luz del pasillo del piso 3 parpadea desde hace semanas y en la noche cuesta ver.",
    category: "infraestructura",
    anonymous: true,
    status: "received",
    createdAt: daysAgo(0),
    classification: null,
  },
];

/** Example classification shown after submitting the mock form. */
export function exampleClassification(text: string, category: string | null): ReportClassification {
  const normalized = text.toLowerCase();
  const place = /sala\s+[a-z]?-?\d+/i.exec(text)?.[0] ?? (normalized.includes("biblioteca") ? "Biblioteca" : null);
  return {
    category: (category as ReportClassification["category"]) ?? "otro",
    place,
    severity: normalized.includes("urgente") || normalized.includes("peligro") ? 3 : 2,
    summary: text.length > 70 ? `${text.slice(0, 67).trimEnd()}…` : text,
    missingInfo: !place,
  };
}
