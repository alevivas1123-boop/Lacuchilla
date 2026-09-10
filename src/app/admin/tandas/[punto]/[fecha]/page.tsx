import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, PackageCheck } from "lucide-react";

import { accionCambiarEstadoPedido } from "@/app/admin/actions-pedidos";
import { BarraAdmin } from "@/components/admin/BarraAdmin";
import { BotonEstadoPedido } from "@/components/admin/BotonEstadoPedido";
import { DistintivoEstado } from "@/components/admin/DistintivoEstado";
import { hojaDeCarga, obtenerPunto, pedidosDeLaTanda } from "@/db/queries-pedidos";
import type { OrderItemRow, OrderRow } from "@/db/schema";
import { transicionesDe } from "@/lib/estados-pedido";
import { formatPrice, formatQuantity } from "@/lib/format";
import { fechaLegible, franjaHoraria } from "@/lib/retiros";

export const metadata: Metadata = {
  title: "Hoja de carga",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export default async function HojaDeCargaPage({
  params,
}: {
  params: Promise<{ punto: string; fecha: string }>;
}) {
  const { punto: puntoId, fecha } = await params;
  if (!UUID.test(puntoId) || !FECHA.test(fecha)) notFound();

  const [punto, carga, pedidos] = await Promise.all([
    obtenerPunto(puntoId),
    hojaDeCarga(puntoId, fecha),
    pedidosDeLaTanda(puntoId, fecha),
  ]);

  if (pedidos.length === 0 && !punto) notFound();

  // El nombre sale del pedido si el punto se dio de baja: la hoja tiene que
  // seguir sirviendo aunque después se haya cambiado la configuración.
  const nombre = punto?.name ?? pedidos[0]?.pedido.pickupPointName ?? "Entrega";
  const vivos = pedidos.filter(({ pedido }) => pedido.status !== "cancelado");
  const sinCobrar = vivos.filter(({ pedido }) => pedido.status === "pendiente_pago");
  const aPreparar = vivos.filter(({ pedido }) => pedido.status !== "pendiente_pago");
  const total = aPreparar.reduce((suma, { pedido }) => suma + pedido.total, 0);

  return (
    <>
      <div className="print:hidden">
        <BarraAdmin />
      </div>

      <main className="container-page flex-1 py-8 sm:py-10">
        <Link
          href="/admin/pedidos"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-bark transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink print:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver a los pedidos
        </Link>

        <header className="mt-3">
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl break-words">
            {nombre} · {fechaLegible(fecha)}
          </h1>
          <p className="mt-1.5 text-sm text-bark">
            {punto ? `${punto.address} · ${franjaHoraria(punto.timeFrom, punto.timeTo)}` : null}
          </p>
          <p className="mt-1 text-sm text-bark">
            {aPreparar.length} {aPreparar.length === 1 ? "pedido pago" : "pedidos pagos"} ·{" "}
            {formatPrice(total)}
          </p>
        </header>

        {sinCobrar.length > 0 ? (
          <p className="mt-5 flex items-start gap-3 rounded-card border-2 border-cheese/60 bg-cheese/10 px-4 py-3 text-sm leading-relaxed text-ink">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cheese-deep" />
            <span>
              Hay {sinCobrar.length} {sinCobrar.length === 1 ? "pedido" : "pedidos"} sin cobrar. No
              están sumados en lo que hay que llevar: confirmá el pago primero si querés
              prepararlos.
            </span>
          </p>
        ) : null}

        <section className="mt-6 rounded-card border-2 border-ink/15 bg-card p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Qué llevar</h2>
          <p className="mt-1 text-sm text-bark">
            El total de todos los pedidos pagos de este día.
          </p>

          {carga.length === 0 ? (
            <p className="mt-4 text-sm text-bark">
              Todavía no hay pedidos pagos para esta entrega.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {carga.map((linea) => (
                <li
                  key={`${linea.productName}-${linea.unitLabel}`}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <span className="min-w-0 font-medium text-ink break-words">
                    {linea.productName}
                    <span className="ml-2 text-sm font-normal text-bark">
                      ({linea.pedidos} {linea.pedidos === 1 ? "pedido" : "pedidos"})
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-xl font-semibold text-ink tabular-nums">
                    {formatQuantity(linea.cantidad, linea.unitLabel)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6">
          <h2 className="font-display text-xl font-semibold text-ink">Qué es de quién</h2>
          <p className="mt-1 text-sm text-bark">
            Una tarjeta por pedido, para ir armando bolsa por bolsa.
          </p>

          {vivos.length === 0 ? (
            <p className="mt-4 rounded-card border border-ink/10 bg-card p-6 text-center text-sm text-bark">
              No hay pedidos para esta entrega.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {vivos.map(({ pedido, lineas }) => (
                <BolsaDelCliente
                  key={pedido.id}
                  pedido={pedido}
                  lineas={lineas}
                  accion={accionCambiarEstadoPedido}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function BolsaDelCliente({
  pedido,
  lineas,
  accion,
}: {
  pedido: OrderRow;
  lineas: OrderItemRow[];
  accion: (formData: FormData) => Promise<void>;
}) {
  // Desde la hoja de carga solo interesa avanzar: preparar y entregar. Cancelar
  // se hace desde el detalle, con su motivo.
  const avances = transicionesDe(pedido.status).filter(
    (estado) => estado === "preparado" || estado === "entregado",
  );

  return (
    <li className="flex flex-col rounded-card border border-ink/10 bg-card p-4 break-inside-avoid">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <Link
          href={`/admin/pedidos/${pedido.id}`}
          className="min-w-0 font-display text-lg font-semibold text-ink break-words hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {pedido.customerName}
        </Link>
        <DistintivoEstado estado={pedido.status} />
      </div>
      <p className="mt-0.5 font-mono text-xs text-bark">{pedido.orderNumber}</p>

      <ul className="mt-3 space-y-1.5 text-sm">
        {lineas.map((linea) => (
          <li key={linea.id} className="flex justify-between gap-3">
            <span className="min-w-0 text-ink break-words">{linea.productName}</span>
            <span className="shrink-0 font-semibold text-ink tabular-nums">
              {formatQuantity(linea.quantity, linea.unitLabel)}
            </span>
          </li>
        ))}
      </ul>

      {pedido.notes ? (
        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-sm text-bark break-words">
          {pedido.notes}
        </p>
      ) : null}

      <p className="mt-3 flex justify-between gap-3 border-t border-ink/8 pt-3 text-sm">
        <span className="text-bark">Total</span>
        <span className="font-semibold text-ink tabular-nums">{formatPrice(pedido.total)}</span>
      </p>

      {avances.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          {avances.map((estado) => (
            <BotonEstadoPedido
              key={estado}
              id={pedido.id}
              estado={estado}
              accion={accion}
              tamano="sm"
            />
          ))}
        </div>
      ) : pedido.status === "pendiente_pago" ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-cheese-deep print:hidden">
          <PackageCheck aria-hidden="true" className="size-4 shrink-0" />
          Falta confirmar el pago
        </p>
      ) : null}
    </li>
  );
}
