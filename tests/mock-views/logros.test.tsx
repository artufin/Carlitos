// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AchievementsMock } from "@/app/logros/achievements-mock";

describe("mock view: /logros", () => {
  it("renders badges, global progress and the categories", () => {
    render(<AchievementsMock />);
    expect(screen.getByRole("heading", { name: "Insignias" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Progreso global" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Campus" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Carretes" })).toBeTruthy();
    expect(screen.getByText("Ir al baño del 5to piso de las K")).toBeTruthy();
    expect(screen.getAllByText("Foto de evidencia (próximamente)").length).toBeGreaterThan(0);
  });

  it("marks a mission as completed in memory and unlocks dependents", () => {
    render(<AchievementsMock />);
    expect(screen.getByText("3/12 misiones · 25%")).toBeTruthy();
    expect(screen.getAllByText("Bloqueado").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Marcar como cumplido: Ir a tu primer carrete del CAi" }));
    expect(screen.getByText("4/12 misiones · 33%")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Desmarcar: Ir a tu primer carrete del CAi" })).toBeTruthy();
    // "Participar en una alianza" depended on the first carrete and is now available.
    expect(screen.getByRole("button", { name: "Marcar como cumplido: Participar en una alianza" })).toBeTruthy();
  });
});
