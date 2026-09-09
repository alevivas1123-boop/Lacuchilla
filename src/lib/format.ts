import { formatearPesos } from "@/lib/money";
import type { SaleType } from "@/lib/types";

/** Precio en pesos uruguayos enteros. Ej: 1170 -> "$1.170". */
export const formatPrice = formatearPesos;

/** "3 kg" o "2 unidades", según cómo se venda el producto. */
export function formatQuantity(quantity: number, unitLabel: string): string {
  if (quantity === 1) return `1 ${unitLabel}`;
  // "unidad" y "frasco" pluralizan; "kg" no.
  const plural = /^(kg|g|ml|l)$/i.test(unitLabel) ? unitLabel : `${unitLabel}es`.replace(/aes$/, "as").replace(/oes$/, "os");
  return `${quantity} ${plural}`;
}

/** "por kg" o "por unidad", para acompañar el precio. */
export function unitLabelText(unitLabel: string): string {
  return `por ${unitLabel}`;
}

/** Etiqueta del selector según el tipo de venta. */
export function etiquetaSelector(saleType: SaleType): string {
  return saleType === "weight" ? "Peso" : "Cantidad";
}
