// Shared test setup. Component tests run in jsdom (declare it per file with
// `// @vitest-environment jsdom`); this adds the browser APIs jsdom lacks.

import { afterEach } from "vitest";

afterEach(async () => {
  if (typeof window !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }

  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  if (!("IntersectionObserver" in window)) {
    Object.defineProperty(window, "IntersectionObserver", { value: NoopObserver, writable: true });
  }
  if (!("ResizeObserver" in window)) {
    Object.defineProperty(window, "ResizeObserver", { value: NoopObserver, writable: true });
  }
  if (!window.scrollTo) {
    window.scrollTo = () => undefined;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
}
