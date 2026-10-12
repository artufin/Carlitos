// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaymentsMock } from "@/app/pagos/payments-mock";

describe("mock view: /pagos", () => {
  it("renders the permanent DEMO banner and the item list", () => {
    render(<PaymentsMock />);
    expect(screen.getByRole("status").textContent).toContain("DEMO: no se procesan pagos");
    expect(screen.getByRole("button", { name: /Cuota CAi 2026/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Entrada carrete de bienvenida/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Polera CAi/ })).toBeTruthy();
  });

  it("walks through the steps to the demo receipt, keeping the banner visible", () => {
    render(<PaymentsMock />);

    // Step 1 -> 2: choose a merch item and change the quantity.
    fireEvent.click(screen.getByRole("button", { name: /Polera CAi/ }));
    expect(screen.getByRole("heading", { name: "Resumen de tu compra" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Agregar una unidad" }));
    expect(screen.getByText(/2 × /)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("DEMO: no se procesan pagos");

    // "Volver" goes back to the item list, then forward again.
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByRole("heading", { name: "¿Qué quieres pagar?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Taza CAi/ }));

    // Step 2 -> 3: payment method with disabled example fields only.
    fireEvent.click(screen.getByRole("button", { name: "Ir a pagar" }));
    expect(screen.getByRole("heading", { name: "Método de pago" })).toBeTruthy();
    const cardNumber = screen.getByLabelText("Número de tarjeta") as HTMLInputElement;
    expect(cardNumber.disabled).toBe(true);
    expect(cardNumber.value).toContain("1234");

    fireEvent.click(screen.getByLabelText(/Transferencia/));
    expect((screen.getByLabelText("Número de cuenta") as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("DEMO: no se procesan pagos");

    // Step 3 -> 4: demo receipt.
    fireEvent.click(screen.getByRole("button", { name: /^Pagar/ }));
    expect(screen.getByText("Comprobante de demostración, sin validez")).toBeTruthy();
    expect(screen.getByText(/DEMO-\d{6}/)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("DEMO: no se procesan pagos");

    // Reset returns to the first step.
    fireEvent.click(screen.getByRole("button", { name: "Hacer otro pago (demo)" }));
    expect(screen.getByRole("heading", { name: "¿Qué quieres pagar?" })).toBeTruthy();
  });
});
