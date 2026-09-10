import Link from "next/link";
import { CalendarDays, Phone } from "lucide-react";

import { BotonEstadoPedido } from "@/components/admin/BotonEstadoPedido";
import { DistintivoEstado } from "@/components/admin/DistintivoEstado";
import type { OrderRow } from "@/db/schema";
import { transicionesDe } from "@/lib/estados-pedido";
import { formatPrice } from "@/lib/format";
import { fechaCorta } from "@/lib/retiros";

/**
 * Un pedido en el listado del panel.
 *
 * Es una tarjeta y no una fila de tabla porque el dueño confirma los pagos
 * desde el celular, con el banco abierto en otra app: el monto tiene que
 * leerse de un vistazo y el botón tiene que entrar en el pulgar.
 */
export function TarjetaPedido({
  pedido,
  accion,
}: {
  pedido: OrderRow;
  accion: (formData: FormData) => Promise<void>;
}) {
  const siguientes = transicionesDe(pedido.status);
  // El primero es el paso natural (confirmar pago, preparar, entregar); el
  // resto son salidas, y cancelar siempre va último y sin destacar.
  const principal = siguientes.filter((estado) => estado !== "cancelado");
  const cancelar = siguientes.includes("cancelado");

  return (
    <li className="rounded-card border border-ink/10 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink break-words">
            {pedido.customerName}
          </h3>
          <p className="mt-0.5 font-mono text-xs text-bark">{pedido.orderNumber}</p>
        </div>
        <p className="font-display text-2xl font-semibold text-ink tabular-nums">
          {formatPrice(pedido.total)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-bark">
        <DistintivoEstado estado={pedido.status} />
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
          {pedido.pickupPointName} · {fechaCorta(pedido.pickupDate)}
        </span>
        <a
          href={`tel:${pedido.customerPhone}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Phone aria-hidden="true" className="size-3.5 shrink-0" />
          {pedido.customerPhone}
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/8 pt-4">
        {principal.map((estado) => (
          <BotonEstadoPedido key={estado} id={pedido.id} estado={estado} accion={accion} />
        ))}
        <Link
          href={`/admin/pedidos/${pedido.id}`}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-bark transition-colors hover:bg-ink/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Ver detalle
        </Link>
        {cancelar ? (
          <div className="ml-auto">
            <BotonEstadoPedido
              id={pedido.id}
              estado="cancelado"
              accion={accion}
              tamano="sm"
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}
