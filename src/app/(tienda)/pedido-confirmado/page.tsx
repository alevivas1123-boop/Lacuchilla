import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { DatosBancarios } from "@/components/order/DatosBancarios";
import { DetalleDeRetiro } from "@/components/order/DetalleDeRetiro";
import { LineasDelPedido } from "@/components/order/LineasDelPedido";
import { buttonStyles } from "@/components/ui/button-styles";
import { siteConfig, whatsappLink } from "@/config/site";
import { obtenerPedido, obtenerPunto } from "@/db/queries-pedidos";
import { configuracionDeLaTienda } from "@/lib/retiros.server";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  description: "Recibimos tu pedido. Acá están los datos para transferir.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PedidoConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  /*
   * El pedido se busca por su id, no por su número.
   *
   * El número (LC-260918-4821) lleva solo cuatro dígitos al azar y se puede
   * adivinar a mano; el id es un UUID. Como esta página muestra el nombre y el
   * teléfono de quien compró, la URL tiene que ser imposible de tantear.
   */
  const datos = id && UUID.test(id) ? await obtenerPedido(id).catch(() => undefined) : undefined;

  if (!datos) return <NoEncontrado />;

  const { pedido, lineas } = datos;
  const [configuracion, punto] = await Promise.all([
    configuracionDeLaTienda().catch(() => null),
    obtenerPunto(pedido.pickupPointId).catch(() => undefined),
  ]);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="space-y-6">
        <header className="rounded-card border border-ink/10 bg-card p-6 sm:p-8">
          <span className="flex size-14 items-center justify-center rounded-full bg-cheese/20 text-cheese-deep">
            <CheckCircle2 aria-hidden="true" className="size-8" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold text-ink sm:text-4xl">
            ¡Recibimos tu pedido!
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-bark">
            Guardá este número. Transferí el total y, cuando veamos el pago, tu pedido queda pronto
            para el día que elegiste. No hace falta que nos avises.
          </p>

          <dl className="mt-6 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-cream px-4 py-3">
            <dt className="text-sm font-medium text-bark">Número de pedido</dt>
            <dd className="font-display text-xl font-semibold tracking-wide text-ink">
              {pedido.orderNumber}
            </dd>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink(
                `Hola ${siteConfig.name}, acabo de hacer el pedido ${pedido.orderNumber}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles("outline", "lg", "w-full sm:w-auto")}
            >
              <MessageCircle aria-hidden="true" className="size-4.5" />
              Escribinos por WhatsApp
            </a>
            <Link href="/#productos" className={buttonStyles("ghost", "lg", "w-full sm:w-auto")}>
              Volver a la tienda
            </Link>
          </div>
        </header>

        {configuracion ? (
          <DatosBancarios
            configuracion={configuracion}
            total={pedido.total}
            orderNumber={pedido.orderNumber}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
          <DetalleDeRetiro pedido={pedido} instrucciones={punto?.instructions} />
          <LineasDelPedido lineas={lineas} total={pedido.total} />
        </div>
      </div>
    </div>
  );
}

function NoEncontrado() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-xl rounded-card border border-ink/10 bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          No encontramos ese pedido
        </h1>
        <p className="mt-3 text-base leading-relaxed text-bark">
          El enlace puede haber quedado incompleto. Si ya confirmaste tu pedido lo recibimos igual:
          escribinos por WhatsApp y te pasamos el número y los datos para transferir.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsappLink("Hola, hice un pedido y no encuentro la confirmación.")}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles("primary", "lg")}
          >
            <MessageCircle aria-hidden="true" className="size-4.5" />
            Escribinos
          </a>
          <Link href="/#productos" className={buttonStyles("outline", "lg")}>
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
