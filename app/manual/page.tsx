// NOT IMPLEMENTED (MVP): immersive mock of the "Manual novato digital".
// The layout renders /manual without header or bottom nav; the heavy animated
// component is loaded lazily on the client (see manual-loader.tsx).
import type { Metadata } from "next";
import { ManualLoader } from "@/app/manual/manual-loader";

export const metadata: Metadata = { title: "Manual novato" };

export default function ManualPage() {
  return <ManualLoader />;
}
