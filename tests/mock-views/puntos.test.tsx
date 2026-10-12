// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PointsMock } from "@/app/puntos/points-mock";

describe("mock view: /puntos", () => {
  it("renders balance, level and the rewards catalog", () => {
    render(<PointsMock />);
    expect(screen.getByRole("heading", { name: "Saldo disponible" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Nivel 3 · Integral/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Canjear Café en el casino" })).toBeTruthy();
    // Too expensive for the mock balance (320).
    const expensive = screen.getByRole("button", { name: "Canjear Polerón de la escuela" }) as HTMLButtonElement;
    expect(expensive.disabled).toBe(true);
  });

  it("redeems a reward through the dialog and lowers the balance", async () => {
    render(<PointsMock />);
    fireEvent.click(screen.getByRole("button", { name: "Canjear Café en el casino" }));
    expect(await screen.findByRole("button", { name: "Confirmar canje" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar canje" }));
    expect(await screen.findByText("¡Canje listo!")).toBeTruthy();
    expect(screen.getByText(/Tu saldo quedó en 260 CAiPuntos/)).toBeTruthy();
    expect(screen.getByText("260")).toBeTruthy();
  });
});
