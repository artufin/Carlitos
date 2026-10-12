"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push-client";

/** Registers /sw.js once the page is interactive. Renders nothing. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);
  return null;
}
