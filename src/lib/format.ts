/**
 * Formatea un importe en pesos uruguayos: sin decimales y con punto como
 * separador de miles. Ej: 1170 -> "$1.170".
 * Se implementa a mano para que el resultado sea idéntico en servidor y cliente.
 */
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}$${digits}`;
}

/** "3 kg" o "2 unidades", según cómo se venda el producto. */
export function formatQuantity(quantity: number, saleUnit: "kg" | "unit"): string {
  if (saleUnit === "kg") return `${quantity} kg`;
  return quantity === 1 ? "1 unidad" : `${quantity} unidades`;
}

/** "por kg" o "por unidad". */
export function unitLabel(saleUnit: "kg" | "unit"): string {
  return saleUnit === "kg" ? "por kg" : "por unidad";
}
