// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoansMock } from "@/app/prestamos/loans-mock";

describe("mock view: /prestamos", () => {
  it("renders the catalog, the form and the request list", () => {
    render(<LoansMock />);
    expect(screen.getByRole("heading", { name: "Catálogo" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nueva solicitud" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mis solicitudes" })).toBeTruthy();
    expect(screen.getAllByText("Disponible").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Prestado").length).toBeGreaterThan(0);
  });

  it("validates dates and adds a pending request in memory", () => {
    render(<LoansMock />);
    fireEvent.click(screen.getByRole("button", { name: "Solicitar Candado para locker" }));
    const submit = screen.getByRole("button", { name: "Enviar solicitud" });

    fireEvent.click(submit);
    expect(screen.getByRole("alert").textContent).toContain("fecha de retiro");

    fireEvent.change(screen.getByLabelText("Fecha de retiro"), { target: { value: "2030-03-10" } });
    fireEvent.change(screen.getByLabelText("Fecha de devolución"), { target: { value: "2030-03-09" } });
    fireEvent.click(submit);
    expect(screen.getByRole("alert").textContent).toContain("no puede ser antes");

    fireEvent.change(screen.getByLabelText("Fecha de devolución"), { target: { value: "2030-03-12" } });
    fireEvent.click(submit);
    expect(screen.getByRole("status").textContent).toContain("Candado para locker");
    expect(screen.getAllByText("Pendiente").length).toBe(2);
    expect(screen.getAllByText("Reservado").length).toBe(3);
  });

  it("marks an approved request as returned", () => {
    render(<LoansMock />);
    fireEvent.click(screen.getByRole("button", { name: "Marcar devuelta" }));
    expect(screen.queryByRole("button", { name: "Marcar devuelta" })).toBeNull();
    expect(screen.getAllByText("Devuelta").length).toBe(2);
  });
});
