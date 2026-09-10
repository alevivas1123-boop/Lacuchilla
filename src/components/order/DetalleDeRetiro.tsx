import { CalendarDays, MapPin } from "lucide-react";

import { fechaLegible, franjaHoraria } from "@/lib/retiros";
import type { OrderRow } from "@/db/schema";

/**
 * Dónde y cuándo se retira, con los datos copiados en el pedido.
 *
 * Se leen del pedido y no del punto: si mañana cambia el horario de Carrasco,
 * quien ya compró tiene que seguir viendo el que le prometimos.
 */
export function DetalleDeRetiro({
  pedido,
  instrucciones,
}: {
  pedido: OrderRow;
  instrucciones?: string | null;
}) {
  return (
    <section className="rounded-card border border-ink/10 bg-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold text-ink">Dónde lo retirás</h2>

      <div className="mt-4 space-y-4 text-sm">
        <p className="flex items-start gap-3">
          <MapPin aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-cheese-deep" />
          <span className="min-w-0">
            <span className="block font-semibold text-ink break-words">{pedido.pickupPointName}</span>
            <span className="block text-bark break-words">{pedido.pickupAddress}</span>
          </span>
        </p>

        <p className="flex items-start gap-3">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-cheese-deep" />
          <span className="min-w-0">
            <span className="block font-semibold text-ink">{fechaLegible(pedido.pickupDate)}</span>
            <span className="block text-bark">
              {franjaHoraria(pedido.pickupTimeFrom, pedido.pickupTimeTo)}
            </span>
          </span>
        </p>
      </div>

      {instrucciones ? (
        <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-bark break-words">
          {instrucciones}
        </p>
      ) : null}
    </section>
  );
}
