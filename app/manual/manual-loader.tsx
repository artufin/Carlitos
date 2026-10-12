"use client";

// NOT IMPLEMENTED (MVP): lazy loader for the heavy manual mock. The animated
// component is only downloaded on the client when this route is visited.

import dynamic from "next/dynamic";
import { MockBadge } from "@/components/mock-badge";

const ManualMock = dynamic(() => import("@/app/manual/manual-mock").then((mod) => mod.ManualMock), {
  ssr: false,
  loading: () => <ManualSkeleton />,
});

export function ManualLoader() {
  return <ManualMock />;
}

function ManualSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando manual"
      className="flex h-dvh flex-col justify-end px-5 pb-12 text-white"
      style={{ background: "linear-gradient(160deg, #0f172a 0%, #1d4ed8 60%, #38bdf8 100%)" }}
    >
      <MockBadge className="fixed top-4 right-4" />
      <div className="mx-auto w-full max-w-xl space-y-4 animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-24 rounded-full bg-white/30" />
        <div className="h-10 w-3/4 rounded-lg bg-white/40" />
        <div className="h-5 w-full rounded-md bg-white/25" />
        <div className="h-5 w-11/12 rounded-md bg-white/25" />
        <div className="h-5 w-2/3 rounded-md bg-white/25" />
        <div className="h-12 w-36 rounded-full bg-white/40" />
      </div>
      <span className="sr-only">Cargando manual…</span>
    </div>
  );
}
