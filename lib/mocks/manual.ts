// NOT IMPLEMENTED (MVP): chapters for the mock "Manual novato digital".
// All paragraphs are placeholders; nothing here is final content.

import type { ManualChapter, ManualGuide } from "@/lib/types/manual";

export const PLACEHOLDER_PARAGRAPH = "Texto de ejemplo, contenido pendiente.";

const paragraphs = (count: number) => Array.from({ length: count }, () => PLACEHOLDER_PARAGRAPH);

export const manualChapters: ManualChapter[] = [
  {
    id: "man-01",
    slug: "bienvenida",
    order: 1,
    kicker: "Capítulo 1",
    title: "Bienvenida",
    summary: "Lo primero que conviene saber al llegar a la escuela.",
    paragraphs: paragraphs(3),
    gradient: "linear-gradient(160deg, #0f172a 0%, #1d4ed8 60%, #38bdf8 100%)",
    accent: "#7dd3fc",
    illustration: "orbit",
  },
  {
    id: "man-02",
    slug: "como-se-organiza",
    order: 2,
    kicker: "Capítulo 2",
    title: "Cómo se organiza la escuela",
    summary: "Direcciones, departamentos y a quién preguntar qué.",
    paragraphs: paragraphs(3),
    gradient: "linear-gradient(160deg, #1e1b4b 0%, #4338ca 55%, #a78bfa 100%)",
    accent: "#c4b5fd",
    illustration: "blocks",
  },
  {
    id: "man-03",
    slug: "primer-semestre",
    order: 3,
    kicker: "Capítulo 3",
    title: "Sobrevivir el primer semestre",
    summary: "Ritmo de estudio, controles y cómo pedir ayuda a tiempo.",
    paragraphs: paragraphs(3),
    gradient: "linear-gradient(160deg, #042f2e 0%, #0f766e 55%, #5eead4 100%)",
    accent: "#99f6e4",
    illustration: "waves",
  },
  {
    id: "man-04",
    slug: "donde-comer-y-estudiar",
    order: 4,
    kicker: "Capítulo 4",
    title: "Dónde comer y estudiar",
    summary: "Casinos, patios y salas para distintas horas del día.",
    paragraphs: paragraphs(2),
    gradient: "linear-gradient(160deg, #431407 0%, #c2410c 55%, #fdba74 100%)",
    accent: "#fed7aa",
    illustration: "plates",
  },
  {
    id: "man-05",
    slug: "quien-es-quien",
    order: 5,
    kicker: "Capítulo 5",
    title: "Quién es quién",
    summary: "Representantes, consejeros y comisiones del centro de alumnos.",
    paragraphs: paragraphs(2),
    gradient: "linear-gradient(160deg, #3b0764 0%, #9333ea 55%, #f0abfc 100%)",
    accent: "#f5d0fe",
    illustration: "faces",
  },
  {
    id: "man-06",
    slug: "carretes-y-comunidad",
    order: 6,
    kicker: "Capítulo 6",
    title: "Carretes y comunidad",
    summary: "Alianzas, eventos y cómo participar sin perderse nada.",
    paragraphs: paragraphs(3),
    gradient: "linear-gradient(160deg, #4a044e 0%, #db2777 55%, #fda4af 100%)",
    accent: "#fecdd3",
    illustration: "confetti",
  },
  {
    id: "man-07",
    slug: "si-algo-sale-mal",
    order: 7,
    kicker: "Capítulo 7",
    title: "Qué hacer si algo sale mal",
    summary: "Canales de apoyo, reportes y a quién acudir.",
    paragraphs: paragraphs(3),
    gradient: "linear-gradient(160deg, #052e16 0%, #15803d 55%, #86efac 100%)",
    accent: "#bbf7d0",
    illustration: "shield",
  },
];

export const manualGuide: ManualGuide = {
  title: "Manual novato digital",
  edition: "Edición 2026 (borrador)",
  chapters: manualChapters,
};
