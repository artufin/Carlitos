// NOT IMPLEMENTED (MVP): shapes used by the mock "Galería" view. Designed to
// become Prisma models (`GalleryAlbum`, `GalleryPhoto`) once photos are
// uploaded for real. In the mock every photo is an SVG/gradient placeholder.

export type GalleryAlbumKind = "alianza" | "carrete";

export interface GalleryAlbum {
  id: string;
  title: string;
  kind: GalleryAlbumKind;
  /** ISO date of the event. */
  date: string;
  description: string;
}

/** Aspect ratios available for placeholders (width / height). */
export type GalleryAspect = "square" | "portrait" | "landscape" | "tall" | "wide";

/** Decorative shape drawn on top of the gradient placeholder. */
export type GalleryShape = "circle" | "triangle" | "rings" | "bars" | "diamond";

export interface GalleryItem {
  id: string;
  /** `GalleryAlbum.id`. */
  albumId: string;
  /** Generic caption, e.g. "Alianza Roja 2025 · Día 1". */
  caption: string;
  aspect: GalleryAspect;
  /** Two CSS colors for the placeholder gradient. */
  palette: [string, string];
  shape: GalleryShape;
  /** Future real photo URL. Always null in the mock. */
  url: string | null;
}
