// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GalleryMock } from "@/app/galeria/gallery-mock";

describe("mock view: /galeria", () => {
  it("renders album filters and the placeholder grid", () => {
    render(<GalleryMock />);
    expect(screen.getByRole("button", { name: "Todos" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Alianza Roja 2025" })).toBeTruthy();
    expect(screen.getAllByRole("img").length).toBeGreaterThan(20);

    fireEvent.click(screen.getByRole("button", { name: "Alianza Azul 2025" }));
    expect(screen.getByRole("button", { name: "Alianza Azul 2025" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByRole("img").length).toBe(6);
  });

  it("opens the lightbox, navigates with the keyboard and closes with Escape", () => {
    render(<GalleryMock />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir foto: Alianza Roja 2025 · Día 1 · Apertura" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByTestId("lightbox-caption").textContent).toBe("Alianza Roja 2025 · Día 1 · Apertura");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByTestId("lightbox-caption").textContent).toBe("Alianza Roja 2025 · Día 1 · Barras");

    fireEvent.click(screen.getByRole("button", { name: "Foto anterior" }));
    expect(screen.getByTestId("lightbox-caption").textContent).toBe("Alianza Roja 2025 · Día 1 · Apertura");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
