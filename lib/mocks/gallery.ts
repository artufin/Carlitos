// NOT IMPLEMENTED (MVP): mock albums and placeholder "photos" for the
// gallery. No real images and no real people; every item is a gradient with
// an SVG shape. Replace with uploaded photos when the feature is wired.

import type { GalleryAlbum, GalleryAspect, GalleryItem, GalleryShape } from "@/lib/types/gallery";

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "alb-alianza-roja",
    title: "Alianza Roja 2025",
    kind: "alianza",
    date: "2025-04-11",
    description: "Tres días de competencias, gritos y pintura en la cara.",
  },
  {
    id: "alb-alianza-azul",
    title: "Alianza Azul 2025",
    kind: "alianza",
    date: "2025-04-11",
    description: "La alianza que prometió ganar y casi lo logra.",
  },
  {
    id: "alb-bienvenida",
    title: "Carrete de bienvenida",
    kind: "carrete",
    date: "2025-03-21",
    description: "El primer carrete del año, con novatos y todo.",
  },
  {
    id: "alb-fiesta-primavera",
    title: "Fiesta de la primavera",
    kind: "carrete",
    date: "2025-09-26",
    description: "Cierre de semestre con música y demasiadas fotos movidas.",
  },
];

const PALETTES: [string, string][] = [
  ["#f87171", "#fbbf24"],
  ["#60a5fa", "#a78bfa"],
  ["#34d399", "#60a5fa"],
  ["#f472b6", "#fb923c"],
  ["#818cf8", "#22d3ee"],
  ["#facc15", "#4ade80"],
  ["#fb7185", "#c084fc"],
  ["#2dd4bf", "#a3e635"],
];

const ASPECTS: GalleryAspect[] = ["portrait", "square", "landscape", "tall", "wide", "square", "portrait", "landscape"];
const SHAPES: GalleryShape[] = ["circle", "triangle", "rings", "bars", "diamond", "circle", "bars", "rings"];

const ALIANZA_MOMENTS = [
  "Día 1 · Apertura",
  "Día 1 · Barras",
  "Día 2 · Competencias",
  "Día 2 · Coreografía",
  "Día 3 · Final",
  "Día 3 · Premiación",
  "Día 3 · Foto grupal",
  "Día 1 · Pintura de caras",
];

function buildAlbum(album: GalleryAlbum, count: number, offset: number): GalleryItem[] {
  return Array.from({ length: count }, (_, i) => {
    const n = (i + offset) % PALETTES.length;
    const day = album.kind === "alianza" ? ` · ${ALIANZA_MOMENTS[i % ALIANZA_MOMENTS.length]}` : ` · Foto ${i + 1}`;
    return {
      id: `${album.id}-${i + 1}`,
      albumId: album.id,
      caption: `${album.title}${day}`,
      aspect: ASPECTS[n],
      palette: PALETTES[n],
      shape: SHAPES[n],
      url: null,
    };
  });
}

export const galleryItems: GalleryItem[] = [
  ...buildAlbum(galleryAlbums[0], 8, 0),
  ...buildAlbum(galleryAlbums[1], 6, 3),
  ...buildAlbum(galleryAlbums[2], 7, 5),
  ...buildAlbum(galleryAlbums[3], 7, 2),
];
