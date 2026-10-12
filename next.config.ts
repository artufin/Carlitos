import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (PPR) are disabled on purpose: every page in this MVP
  // depends on the per-device session cookie and the database, so pages are
  // rendered dynamically. See docs/DECISIONS.md.
  cacheComponents: false,
  reactCompiler: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // The service worker must be served from the origin root and must
        // never be cached aggressively, otherwise updates are not picked up.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
