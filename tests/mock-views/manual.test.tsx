// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManualMock } from "@/app/manual/manual-mock";
import { manualChapters, PLACEHOLDER_PARAGRAPH } from "@/lib/mocks/manual";

describe("mock view: /manual", () => {
  it("renders every chapter title, the mock badge and the exit link", () => {
    render(<ManualMock />);
    for (const chapter of manualChapters) {
      expect(screen.getByRole("heading", { name: chapter.title })).toBeTruthy();
    }
    expect(screen.getAllByText(PLACEHOLDER_PARAGRAPH).length).toBeGreaterThan(0);
    expect(screen.getByText("Maqueta")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Salir/ }).getAttribute("href")).toBe("/");
  });

  it("exposes chapter navigation (dots and Siguiente buttons)", () => {
    render(<ManualMock />);
    const dots = screen.getAllByRole("button", { name: /Ir al capítulo/ });
    expect(dots).toHaveLength(manualChapters.length);
    expect(dots[0].getAttribute("aria-current")).toBe("true");
    // scrollIntoView is polyfilled in tests/setup.ts; clicking must not throw.
    fireEvent.click(dots[2]);
    expect(screen.getAllByRole("button", { name: "Siguiente" })).toHaveLength(manualChapters.length - 1);
    expect(screen.getByRole("link", { name: /Volver al inicio/ })).toBeTruthy();
  });
});
