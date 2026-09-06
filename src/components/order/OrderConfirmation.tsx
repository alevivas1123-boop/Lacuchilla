"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";

import { OrderSummary } from "@/components/checkout/OrderSummary";
import { buttonStyles } from "@/components/ui/button-styles";
import { siteConfig, whatsappLink } from "@/config/site";
import {
  getLastOrderServerSnapshot,
  getLastOrderSnapshot,
  parseOrder,
  subscribeToLastOrder,
} from "@/lib/order-storage";

const fulfillmentLabel = {
  envio: "Envío a domicilio",
  retiro: "Retiro en el local",
} as const;

export function OrderConfirmation() {
  // El pedido vive en sessionStorage: se lee como store externo para que el
  // render del servidor y el del navegador no entren en conflicto.
  const raw = useSyncExternalStore(
    subscribeToLastOrder,
    getLastOrderSnapshot,
    getLastOrderServerSnapshot,
  );
  const loaded = raw !== undefined;
  const order = useMemo(() => parseOrder(raw), [raw]);

  if (!loaded) {
    return (
      <div aria-hidden="true" className="animate-pulse space-y-4">
        <div className="h-10 w-2/3 rounded bg-cream-deep" />
        <div className="h-4 w-1/2 rounded bg-cream-deep" />
        <div className="h-48 rounded-card bg-cream-deep" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-card border border-ink/10 bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          No encontramos un pedido reciente
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-bark">
          Puede que hayas recargado la página en una sesión nueva. Si ya confirmaste tu pedido, lo
          recibimos igual y te vamos a escribir. Si no, podés armarlo de nuevo.
        </p>
        <Link href="/#productos" className={buttonStyles("primary", "lg", "mt-6")}>
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const { customer } = order;
  const whatsappMessage = `Hola ${siteConfig.name}, acabo de hacer el pedido ${order.orderNumber}.`;

  return (
    <div className="space-y-8">
      <header className="rounded-card border border-ink/10 bg-card p-6 sm:p-8">
        <span className="flex size-14 items-center justify-center rounded-full bg-cheese/20 text-cheese-deep">
          <CheckCircle2 aria-hidden="true" className="size-8" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink sm:text-4xl">
          ¡Recibimos tu pedido!
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-bark">
          Te enviaremos por WhatsApp los datos para realizar la transferencia y coordinar la
          entrega.
        </p>

        <dl className="mt-6 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-cream px-4 py-3">
          <dt className="text-sm font-medium text-bark">Número de pedido</dt>
          <dd className="font-display text-xl font-semibold tracking-wide text-ink">
            {order.orderNumber}
          </dd>
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles("primary", "lg", "w-full sm:w-auto")}
          >
            <MessageCircle aria-hidden="true" className="size-4.5" />
            Escribinos por WhatsApp
          </a>
          <Link href="/#productos" className={buttonStyles("outline", "lg", "w-full sm:w-auto")}>
            Volver a la tienda
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
        <OrderSummary items={order.items} total={order.total} title="Lo que pediste" />

        <div className="rounded-card border border-ink/10 bg-card p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Tus datos</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Nombre" value={customer.fullName} />
            <Row label="Teléfono" value={customer.phone} />
            {customer.email ? <Row label="Email" value={customer.email} /> : null}
            <Row label="Modalidad" value={fulfillmentLabel[customer.fulfillment]} />
            {customer.address ? <Row label="Dirección" value={customer.address} /> : null}
            {customer.locality ? <Row label="Localidad" value={customer.locality} /> : null}
            {customer.preferredTime ? (
              <Row label="Preferencia horaria" value={customer.preferredTime} />
            ) : null}
            {customer.notes ? <Row label="Comentarios" value={customer.notes} /> : null}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink/8 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="font-medium text-bark">{label}</dt>
      <dd className="text-ink break-words sm:max-w-[60%] sm:text-right">{value}</dd>
    </div>
  );
}
