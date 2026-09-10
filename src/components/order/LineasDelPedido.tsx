import { formatPrice, formatQuantity, unitLabelText } from "@/lib/format";
import type { OrderItemRow } from "@/db/schema";

/**
 * Las líneas del pedido, tal como quedaron guardadas.
 *
 * Los precios salen de la línea y no del producto: es lo que se cobró, no lo
 * que el producto vale hoy.
 */
export function LineasDelPedido({
  lineas,
  total,
  titulo = "Lo que pediste",
}: {
  lineas: OrderItemRow[];
  total: number;
  titulo?: string;
}) {
  return (
    <section className="rounded-card border border-ink/10 bg-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold text-ink">{titulo}</h2>

      <ul className="mt-4 divide-y divide-ink/10">
        {lineas.map((linea) => (
          <li key={linea.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-ink break-words">{linea.productName}</p>
              <p className="text-sm text-bark">
                {linea.saleType === "weight"
                  ? formatQuantity(linea.quantity, linea.unitLabel)
                  : `${formatQuantity(linea.quantity, linea.unitLabel)} · ${linea.presentation}`}
                {" · "}
                {formatPrice(linea.unitPrice)} {unitLabelText(linea.unitLabel)}
              </p>
            </div>
            <p className="shrink-0 font-semibold text-ink tabular-nums">
              {formatPrice(linea.lineTotal)}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-1 flex items-baseline justify-between gap-3 border-t border-ink/10 pt-4">
        <span className="font-medium text-bark">Total</span>
        <span className="font-display text-2xl font-semibold text-ink tabular-nums">
          {formatPrice(total)}
        </span>
      </p>
    </section>
  );
}
