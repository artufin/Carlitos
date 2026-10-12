// NOT IMPLEMENTED (MVP): mock view, every "photo" is a placeholder.
import type { Metadata } from "next";
import { GalleryMock } from "@/app/galeria/gallery-mock";
import { PageHeader } from "@/components/mock-badge";

export const metadata: Metadata = { title: "Galería" };

export default function GalleryPage() {
  return (
    <div>
      <PageHeader
        title="Galería"
        mock
        description="Fotos de alianzas y carretes. En esta demo las imágenes son placeholders."
      />
      <GalleryMock />
    </div>
  );
}
