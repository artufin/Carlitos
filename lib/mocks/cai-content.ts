// NOT IMPLEMENTED (MVP): placeholder structure for the content of cai.cl.
// Nothing here was scraped or copied from the real site: every value is a
// placeholder marked "pendiente de migrar", and no real person is named.

import type {
  CaiAgreement,
  CaiAgreementCategory,
  CaiDocument,
  CaiDocumentType,
  CaiRepresentative,
  CaiRepresentativeArea,
  CaiSiteContent,
  MigrationStatus,
} from "@/lib/types/cai-content";

export const PENDING_MIGRATION: MigrationStatus = "pendiente de migrar";

const pending = (label: string) => `${label} (${PENDING_MIGRATION})`;

export const caiRepresentativeAreaLabel: Record<CaiRepresentativeArea, string> = {
  directiva: "Directiva",
  consejeria: "Consejería",
  comision: "Comisiones",
};

export const caiAgreementCategoryLabel: Record<CaiAgreementCategory, string> = {
  alimentacion: "Alimentación",
  salud: "Salud",
  deporte: "Deporte",
  cultura: "Cultura",
  servicios: "Servicios",
  otro: "Otro",
};

export const caiDocumentTypeLabel: Record<CaiDocumentType, string> = {
  estatuto: "Estatuto",
  reglamento: "Reglamento",
  acta: "Acta",
  presupuesto: "Presupuesto",
  informe: "Informe",
  otro: "Otro",
};

const representative = (id: string, role: string, area: CaiRepresentativeArea): CaiRepresentative => ({
  id,
  role,
  area,
  name: pending("Nombre pendiente"),
  contact: pending("Correo pendiente"),
  migration: PENDING_MIGRATION,
});

const agreement = (id: string, index: number, category: CaiAgreementCategory): CaiAgreement => ({
  id,
  partner: pending(`Convenio pendiente ${index}`),
  category,
  benefit: pending("Beneficio pendiente"),
  howToUse: pending("Cómo usarlo pendiente"),
  validUntil: null,
  migration: PENDING_MIGRATION,
});

const document = (id: string, title: string, type: CaiDocumentType): CaiDocument => ({
  id,
  title: pending(title),
  type,
  url: "#",
  updatedAt: null,
  migration: PENDING_MIGRATION,
});

export const caiContent: CaiSiteContent = {
  about: {
    intro: pending("Texto de presentación pendiente"),
    mission: pending("Misión pendiente"),
    vision: pending("Visión pendiente"),
    history: pending("Historia pendiente"),
    values: [pending("Valor pendiente 1"), pending("Valor pendiente 2"), pending("Valor pendiente 3")],
    migration: PENDING_MIGRATION,
  },
  representatives: [
    representative("rep-presidencia", "Presidencia", "directiva"),
    representative("rep-vicepresidencia", "Vicepresidencia", "directiva"),
    representative("rep-secretaria", "Secretaría general", "directiva"),
    representative("rep-tesoreria", "Tesorería", "directiva"),
    representative("rep-consejeria-1", "Consejería académica 1", "consejeria"),
    representative("rep-consejeria-2", "Consejería académica 2", "consejeria"),
    representative("rep-comision-bienestar", "Comisión de bienestar", "comision"),
    representative("rep-comision-deportes", "Comisión de deportes", "comision"),
    representative("rep-comision-cultura", "Comisión de cultura", "comision"),
  ],
  agreements: [
    agreement("conv-01", 1, "alimentacion"),
    agreement("conv-02", 2, "alimentacion"),
    agreement("conv-03", 3, "salud"),
    agreement("conv-04", 4, "deporte"),
    agreement("conv-05", 5, "cultura"),
    agreement("conv-06", 6, "servicios"),
  ],
  documents: [
    document("doc-estatutos", "Estatutos del centro de alumnos", "estatuto"),
    document("doc-reglamento-elecciones", "Reglamento de elecciones", "reglamento"),
    document("doc-acta-asamblea", "Acta de asamblea", "acta"),
    document("doc-presupuesto", "Presupuesto anual", "presupuesto"),
    document("doc-informe-gestion", "Informe de gestión", "informe"),
  ],
};
