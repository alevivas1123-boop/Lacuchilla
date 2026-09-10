import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone, Truck } from "lucide-react";

import { accionCambiarEstadoPedido } from "@/app/admin/actions-pedidos";
import { BarraAdmin } from "@/components/admin/BarraAdmin";
import { BotonEstadoPedido } from "@/components/admin/BotonEstadoPedido";
import { DistintivoEstado } from "@/components/admin/DistintivoEstado";
import { DetalleDeRetiro } from "@/components/order/DetalleDeRetiro";
import { LineasDelPedido } from "@/components/order/LineasDelPedido";
import { buttonStyles } from "@/components/ui/button-styles";
import { obtenerPedido } from "@/db/queries-pedidos";
import type { OrderRow } from "@/db/schema";
import { transicionesDe } from "@/lib/estados-pedido";
import { fechaUruguaya, normalizarTelefono } from "@/lib/retiros";

export const metadata: Metadata = {
  title: "Detalle del pedido",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const datos = await obtenerPedido(id);
  if (!datos) notFound();

  const { pedido, lineas } = datos;
  const siguientes = transicionesDe(pedido.status);

  return (
    <>
      <BarraAdmin />

      <main className="container-page flex-1 py-8 sm:py-10">
        <Link
          href="/admin/pedidos"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-bark transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver a los pedidos
        </Link>

        <header className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl break-words">
              {pedido.customerName}
            </h1>
            <p className="mt-1 font-mono text-sm text-bark">{pedido.orderNumber}</p>
          </div>
          <DistintivoEstado estado={pedido.status} className="mt-1.5 px-3 py-1 text-sm" />
        </header>

        {siguientes.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-start gap-2">
            {siguientes
              .filter((estado) => estado !== "cancelado")
              .map((estado) => (
                <BotonEstadoPedido
                  key={estado}
                  id={pedido.id}
                  estado={estado}
                  accion={accionCambiarEstadoPedido}
                  tamano="lg"
                />
              ))}
            {siguientes.includes("cancelado") ? (
              <BotonEstadoPedido
                id={pedido.id}
                estado="cancelado"
                accion={accionCambiarEstadoPedido}
              />
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
          <div className="space-y-6">
            <LineasDelPedido lineas={lineas} total={pedido.total} titulo="Qué pidió" />
            <DetalleDeRetiro pedido={pedido} />
          </div>

          <div className="space-y-6">
            <section className="rounded-card border border-ink/10 bg-card p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold text-ink">Contacto</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Fila etiqueta="Nombre" valor={pedido.customerName} />
                <Fila etiqueta="Teléfono" valor={pedido.customerPhone} />
                {pedido.customerEmail ? (
                  <Fila etiqueta="Email" valor={pedido.customerEmail} />
                ) : null}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:${pedido.customerPhone}`} className={buttonStyles("outline", "sm")}>
                  <Phone aria-hidden="true" className="size-4" />
                  Llamar
                </a>
                <a
                  href={`https://wa.me/${normalizarTelefono(pedido.customerPhone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles("outline", "sm")}
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  WhatsApp
                </a>
              </div>

              {pedido.notes ? (
                <div className="mt-4 rounded-xl bg-cream px-4 py-3">
                  <p className="text-xs font-semibold tracking-wide text-bark uppercase">
                    Comentarios del cliente
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink break-words">{pedido.notes}</p>
                </div>
              ) : null}
            </section>

            <Historial pedido={pedido} />

            <Link
              href={`/admin/tandas/${pedido.pickupPointId}/${pedido.pickupDate}`}
              className={buttonStyles("outline", "md", "w-full")}
            >
              <Truck aria-hidden="true" className="size-4" />
              Ver la hoja de carga de este día
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

/** Cuándo pasó cada cosa. Solo se muestran las marcas que existen. */
function Historial({ pedido }: { pedido: OrderRow }) {
  const hitos: { etiqueta: string; momento: Date | null }[] = [
    { etiqueta: "Pedido recibido", momento: pedido.createdAt },
    { etiqueta: "Pago confirmado", momento: pedido.paidAt },
    { etiqueta: "Preparado", momento: pedido.preparedAt },
    { etiqueta: "Entregado", momento: pedido.deliveredAt },
    { etiqueta: "Cancelado", momento: pedido.cancelledAt },
  ];

  return (
    <section className="rounded-card border border-ink/10 bg-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold text-ink">Historial</h2>
      <ol className="mt-4 space-y-3 text-sm">
        {hitos
          .filter((hito) => hito.momento)
          .map((hito) => (
            <li key={hito.etiqueta} className="flex flex-wrap justify-between gap-x-4">
              <span className="font-medium text-ink">{hito.etiqueta}</span>
              <span className="text-bark tabular-nums">{momentoLegible(hito.momento!)}</span>
            </li>
          ))}
      </ol>

      {pedido.cancelReason ? (
        <p className="mt-4 rounded-xl bg-[#9B3B1F]/8 px-4 py-3 text-sm text-ink break-words">
          <span className="font-semibold">Motivo: </span>
          {pedido.cancelReason}
        </p>
      ) : null}
    </section>
  );
}

/** "18/9/26 17:42" en hora de Uruguay, no la del servidor. */
function momentoLegible(momento: Date): string {
  const fecha = fechaUruguaya(momento);
  const [ano, mes, dia] = fecha.split("-");
  const enUy = new Date(momento.getTime() - 3 * 60 * 60 * 1000);
  const hh = String(enUy.getUTCHours()).padStart(2, "0");
  const mm = String(enUy.getUTCMinutes()).padStart(2, "0");
  return `${Number(dia)}/${Number(mes)}/${ano.slice(2)} ${hh}:${mm}`;
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink/8 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="font-medium text-bark">{etiqueta}</dt>
      <dd className="text-ink break-words sm:max-w-[60%] sm:text-right">{valor}</dd>
    </div>
  );
}
