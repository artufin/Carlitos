// NOT IMPLEMENTED (MVP): shapes for the "Manual novato digital" (/manual).
// Designed to become a `ManualChapter` model (or a CMS collection) later.

/** Placeholder illustration drawn with inline SVG shapes. */
export type ManualIllustration = "orbit" | "blocks" | "waves" | "plates" | "faces" | "confetti" | "shield";

export interface ManualChapter {
  id: string;
  /** URL-safe anchor, e.g. "bienvenida". */
  slug: string;
  /** 1-based position in the guide. */
  order: number;
  /** Small label above the title, e.g. "Capítulo 1". */
  kicker: string;
  title: string;
  /** One-line summary shown under the title. */
  summary: string;
  /** Placeholder paragraphs ("Texto de ejemplo, contenido pendiente."). */
  paragraphs: string[];
  /** CSS gradient used as the full-screen background. */
  gradient: string;
  /** Accent colour (hex) used by shapes and the "Siguiente" button. */
  accent: string;
  illustration: ManualIllustration;
}

export interface ManualGuide {
  title: string;
  /** e.g. "Edición 2026 (borrador)". */
  edition: string;
  chapters: ManualChapter[];
}
