// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarMock } from "@/app/calendario/calendar-mock";

describe("mock view: /calendario", () => {
  it("renders the view toggle, filters and the subscribe button", () => {
    render(<CalendarMock />);
    expect(screen.getByRole("tab", { name: "Mes" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Lista" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Suscribirme al calendario (.ics)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Carrete" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("grid", { name: "Días del mes" })).toBeTruthy();
  });

  it("toggles a type filter and hides those events from the upcoming list", () => {
    render(<CalendarMock />);
    fireEvent.click(screen.getByRole("tab", { name: "Lista" }));
    expect(screen.getByRole("heading", { name: "Próximos eventos" })).toBeTruthy();
    expect(screen.getByText("Carrete de bienvenida")).toBeTruthy();

    const chip = screen.getByRole("button", { name: "Carrete" });
    fireEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText("Carrete de bienvenida")).toBeNull();
  });

  it("signs up to an event in memory and shows the confirmation", () => {
    render(<CalendarMock />);
    fireEvent.click(screen.getByRole("tab", { name: "Lista" }));
    fireEvent.click(screen.getByText("Carrete de bienvenida"));
    expect(screen.getByText(/CAiPuntos/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Inscribirme" }));
    expect((screen.getByLabelText("Correo UC") as HTMLInputElement).value).toMatch(/@uc\.cl$/);
    expect(screen.getByLabelText(/Restricciones alimentarias/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar inscripción" }));
    expect(screen.getByText("Inscripción confirmada")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Agregar a mi calendario" }));
    expect(screen.getByRole("status").textContent).toContain("solo visual");
  });
});
