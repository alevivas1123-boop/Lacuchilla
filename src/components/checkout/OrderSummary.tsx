import { siteConfig } from "@/config/site";
import { lineTotal } from "@/lib/cart-store";
import { formatPrice, formatQuantity, unitLabelText } from "@/lib/format";
import type { CartItem } from "@/lib/types";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
  title?: string;
  /** Muestra el aviso de pago por transferencia. */
  withPaymentNotice?: boolean;
}

export function OrderSummary({
  items,
  total,
  title = "Resumen del pedido",
  withPaymentNotice = true,
}: OrderSummaryProps) {
  return (
    <div className="rounded-card border border-ink/10 bg-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>

      <ul className="mt-4 divide-y divide-ink/10">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-ink">{item.name}</p>
              <p className="text-sm text-bark">
                {item.saleType === "weight"
                  ? formatQuantity(item.quantity, item.unitLabel)
                  : `${formatQuantity(item.quantity, item.unitLabel)} · ${item.presentation}`}
                {" · "}
                {formatPrice(item.unitPrice)} {unitLabelText(item.unitLabel)}
              </p>
            </div>
            <p className="shrink-0 font-semibold text-ink tabular-nums">
              {formatPrice(lineTotal(item))}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-1 space-y-2 border-t border-ink/10 pt-4">
        <p className="flex items-center justify-between gap-3 text-sm">
          <span className="text-bark">Envío</span>
          <span className="text-ink/80">A coordinar</span>
        </p>
        <p className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-bark">Total</span>
          <span className="font-display text-2xl font-semibold text-ink tabular-nums">
            {formatPrice(total)}
          </span>
        </p>
      </div>

      {withPaymentNotice ? (
        <p className="mt-4 rounded-xl bg-cheese/12 p-4 text-sm leading-relaxed text-ink">
          {siteConfig.paymentNotice}
        </p>
      ) : null}
    </div>
  );
}
