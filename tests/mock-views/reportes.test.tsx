// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportsMock } from "@/app/reportes/reports-mock";
import { AdminReportsMock } from "@/app/admin/reportes/admin-reports-mock";

describe("mock view: /reportes", () => {
  it("renders the form and the example list", () => {
    render(<ReportsMock />);
    expect(screen.getByLabelText("¿Qué pasó?")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mis reportes" })).toBeTruthy();
  });

  it("validates short text and confirms a valid report in memory", () => {
    render(<ReportsMock />);
    const textarea = screen.getByLabelText("¿Qué pasó?");
    fireEvent.change(textarea, { target: { value: "corto" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));
    expect(screen.getByRole("alert").textContent).toContain("mínimo 20 caracteres");

    fireEvent.change(textarea, { target: { value: "En la sala B-21 hay enchufes que no funcionan desde hace semanas." } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));
    expect(screen.getByText("Reporte recibido, clasificación pendiente")).toBeTruthy();
    expect(screen.getByText(/la clasificación automática aún no está activa/i)).toBeTruthy();
  });
});

describe("mock view: /admin/reportes", () => {
  it("renders and filters by status", () => {
    render(<AdminReportsMock />);
    expect(screen.getAllByText(/Estado/).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Estado", { selector: "#f-status" }), { target: { value: "resolved" } });
    expect(screen.getByText(/Wifi inestable/)).toBeTruthy();
  });
});
