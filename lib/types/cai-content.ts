// NOT IMPLEMENTED (MVP): structure of the institutional content that today
// lives on the cai.cl site (quiénes somos, representantes, convenios,
// documentos). Only the shape is defined; every value in lib/mocks/cai-content.ts
// is a placeholder marked "pendiente de migrar". Designed to become CMS
// collections or Prisma models when the content is migrated.

/** Marker used on every placeholder value. */
export type MigrationStatus = "pendiente de migrar";

export interface CaiAbout {
  /** Short intro paragraph. */
  intro: string;
  mission: string;
  vision: string;
  /** Short history / context paragraph. */
  history: string;
  /** Values of the organisation (placeholders). */
  values: string[];
  migration: MigrationStatus;
}

export type CaiRepresentativeArea = "directiva" | "consejeria" | "comision";

export interface CaiRepresentative {
  id: string;
  /** Structural role, e.g. "Presidencia". Not a person. */
  role: string;
  area: CaiRepresentativeArea;
  /** Placeholder, never a real person: "Nombre pendiente". */
  name: string;
  /** Placeholder contact, e.g. "correo pendiente". */
  contact: string;
  migration: MigrationStatus;
}

export type CaiAgreementCategory = "alimentacion" | "salud" | "deporte" | "cultura" | "servicios" | "otro";

export interface CaiAgreement {
  id: string;
  /** Placeholder partner name: "Convenio pendiente N". */
  partner: string;
  category: CaiAgreementCategory;
  /** Placeholder benefit description. */
  benefit: string;
  /** How to use it (placeholder). */
  howToUse: string;
  /** ISO date or null when unknown. */
  validUntil: string | null;
  migration: MigrationStatus;
}

export type CaiDocumentType = "estatuto" | "reglamento" | "acta" | "presupuesto" | "informe" | "otro";

export interface CaiDocument {
  id: string;
  title: string;
  type: CaiDocumentType;
  /** Placeholder URL ("#") until files are migrated. */
  url: string;
  /** ISO date or null when unknown. */
  updatedAt: string | null;
  migration: MigrationStatus;
}

export interface CaiSiteContent {
  about: CaiAbout;
  representatives: CaiRepresentative[];
  agreements: CaiAgreement[];
  documents: CaiDocument[];
}
