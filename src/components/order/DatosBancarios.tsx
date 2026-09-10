import { Landmark, MessageCircle } from "lucide-react";

import { buttonStyles } from "@/components/ui/button-styles";
import { whatsappLink } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { datosBancariosCompletos } from "@/lib/settings-schema";
import type { StoreSettingsRow } from "@/db/schema";

/**
 * Los datos para transferir.
 *
 * Es la parte de la pantalla que hace que el pedido se cobre, así que va
 * arriba de todo y con el monto en grande. Si la configuración está
 * incompleta se dice sin vueltas y se ofrece WhatsApp: es preferible a
 * mostrar una tarjeta a medias que nadie puede usar.
 */
export function DatosBancarios({
  configuracion,
  total,
  orderNumber,
}: {
  configuracion: StoreSettingsRow;
  total: number;
  orderNumber: string;
}) {
  if (!datosBancariosCompletos(configuracion)) {
    return (
      <section className="rounded-card border-2 border-cheese/60 bg-cheese/10 p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Para pagar tu pedido</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          Escribinos por WhatsApp con tu número de pedido y te pasamos los datos para transferir.
        </p>
        <a
          href={whatsappLink(`Hola, hice el pedido ${orderNumber} y quiero los datos para transferir.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles("primary", "md", "mt-4")}
        >
          <MessageCircle aria-hidden="true" className="size-4.5" />
          Pedir los datos
        </a>
      </section>
    );
  }

  return (
    <section className="rounded-card border-2 border-ink/15 bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cheese/20 text-cheese-deep">
          <Landmark aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-ink">Transferí para confirmar</h2>
          <p className="mt-1 text-sm text-bark">
            Cuando veamos la transferencia dejamos tu pedido pronto para el día que elegiste.
          </p>
        </div>
      </div>

      <p className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl bg-cream px-4 py-3">
        <span className="text-sm font-medium text-bark">Monto a transferir</span>
        <span className="font-display text-2xl font-semibold text-ink tabular-nums">
          {formatPrice(total)}
        </span>
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        <Dato etiqueta="Titular" valor={configuracion.bankHolder} />
        {configuracion.bankName ? <Dato etiqueta="Banco" valor={configuracion.bankName} /> : null}
        {configuracion.bankAccountType ? (
          <Dato etiqueta="Tipo de cuenta" valor={configuracion.bankAccountType} />
        ) : null}
        <Dato etiqueta="Cuenta" valor={configuracion.bankAccount} destacado />
        {configuracion.bankDocument ? (
          <Dato etiqueta="Cédula / RUT" valor={configuracion.bankDocument} destacado />
        ) : null}
        <Dato etiqueta="Referencia" valor={orderNumber} destacado />
      </dl>

      {configuracion.bankInstructions ? (
        <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-bark">
          {configuracion.bankInstructions}
        </p>
      ) : null}
    </section>
  );
}

function Dato({
  etiqueta,
  valor,
  destacado = false,
}: {
  etiqueta: string;
  valor: string | null;
  destacado?: boolean;
}) {
  if (!valor) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink/8 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="font-medium text-bark">{etiqueta}</dt>
      <dd
        className={
          destacado
            ? "font-mono text-base font-semibold text-ink break-all sm:max-w-[60%] sm:text-right"
            : "text-ink break-words sm:max-w-[60%] sm:text-right"
        }
      >
        {valor}
      </dd>
    </div>
  );
}
