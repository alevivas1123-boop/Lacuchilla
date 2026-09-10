import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Truck } from "lucide-react";

import { accionCambiarEstadoPedido } from "@/app/admin/actions-pedidos";
import { BarraAdmin } from "@/components/admin/BarraAdmin";
import { FiltrosPedidos, type OpcionDeTanda } from "@/components/admin/FiltrosPedidos";
import { TarjetaPedido } from "@/components/admin/TarjetaPedido";
import { buttonStyles } from "@/components/ui/button-styles";
import { listarPedidos, listarTandas, type ResumenTanda } from "@/db/queries-pedidos";
import type { OrderRow } from "@/db/schema";
import { esEstado } from "@/lib/estados-pedido";
import { formatPrice } from "@/lib/format";
import { fechaCorta, fechaUruguaya } from "@/lib/retiros";

export const metadata: Metadata = {
  title: "Pedidos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Busqueda {
  q?: string;
  estado?: string;
  /** "puntoId|fecha": las dos mitades de una tanda en un solo parámetro. */
  tanda?: string;
  historico?: string;
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<Busqueda>;
}) {
  const filtros = await searchParams;
  const estado = filtros.estado && esEstado(filtros.estado) ? filtros.estado : "todos";
  const historico = filtros.historico === "1";
  const [puntoId, fecha] = (filtros.tanda ?? "").split("|");
  const hoy = fechaUruguaya(new Date());

  let pedidos: OrderRow[] = [];
  let tandas: ResumenTanda[] = [];
  let errorBase: string | undefined;
  try {
    [pedidos, tandas] = await Promise.all([
      listarPedidos({
        estado,
        busqueda: filtros.q,
        puntoId: puntoId || undefined,
        fecha: fecha || undefined,
        // Sin filtro de tanda, el panel mira hacia adelante: lo entregado la
        // semana pasada no es trabajo pendiente.
        desde: historico || fecha ? undefined : hoy,
      }),
      listarTandas(),
    ]);
  } catch {
    errorBase =
      "No se pudo conectar con la base de datos. Revisá la variable DATABASE_URL del entorno.";
  }

  const opcionesDeTanda: OpcionDeTanda[] = tandas.map((t) => ({
    puntoId: t.pickupPointId,
    puntoNombre: t.pickupPointName,
    fecha: t.pickupDate,
  }));

  return (
    <>
      <BarraAdmin />

      <main className="container-page flex-1 py-8 sm:py-10">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Pedidos</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-bark">
          Confirmá los pagos cuando veas la transferencia en el banco. El cliente no recibe ningún
          aviso: los estados son para vos.
        </p>

        {errorBase ? (
          <p
            role="alert"
            className="mt-5 rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 px-4 py-3 text-sm font-medium text-ink"
          >
            {errorBase}
          </p>
        ) : null}

        {tandas.length > 0 ? (
          <section aria-labelledby="proximas-entregas" className="mt-6">
            <h2
              id="proximas-entregas"
              className="text-xs font-semibold tracking-[0.18em] text-olive uppercase"
            >
              Próximas entregas
            </h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tandas.slice(0, 6).map((tanda) => (
                <TarjetaTanda key={`${tanda.pickupPointId}-${tanda.pickupDate}`} tanda={tanda} />
              ))}
            </ul>
          </section>
        ) : null}

        <FiltrosPedidos
          busqueda={filtros.q ?? ""}
          estado={estado}
          tanda={filtros.tanda ?? ""}
          historico={historico}
          tandas={opcionesDeTanda}
          total={pedidos.length}
        />

        {pedidos.length === 0 && !errorBase ? (
          <div className="mt-6 rounded-card border border-ink/10 bg-card p-8 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-cheese/20 text-cheese-deep">
              <ClipboardList aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">
              No hay pedidos que mostrar
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-bark">
              {filtros.q || estado !== "todos" || filtros.tanda
                ? "Probá quitando algún filtro."
                : "Cuando alguien compre en la tienda, su pedido aparece acá."}
            </p>
          </div>
        ) : null}

        <ul className="mt-6 space-y-3">
          {pedidos.map((pedido) => (
            <TarjetaPedido
              key={pedido.id}
              pedido={pedido}
              accion={accionCambiarEstadoPedido}
            />
          ))}
        </ul>
      </main>
    </>
  );
}

/** Una entrega próxima: cuánto hay que cobrar todavía y el acceso a la hoja de carga. */
function TarjetaTanda({ tanda }: { tanda: ResumenTanda }) {
  return (
    <li className="flex flex-col gap-3 rounded-card border border-ink/10 bg-card p-4">
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold text-ink break-words">
          {tanda.pickupPointName}
        </p>
        <p className="text-sm text-bark">{fechaCorta(tanda.pickupDate)}</p>
      </div>

      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-bark">Pedidos</dt>
          <dd className="font-semibold text-ink tabular-nums">{tanda.pedidos}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-bark">Sin cobrar</dt>
          <dd
            className={
              tanda.pendientes > 0
                ? "font-semibold text-cheese-deep tabular-nums"
                : "font-semibold text-ink tabular-nums"
            }
          >
            {tanda.pendientes}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-bark">Total</dt>
          <dd className="font-semibold text-ink tabular-nums">{formatPrice(tanda.total)}</dd>
        </div>
      </dl>

      <Link
        href={`/admin/tandas/${tanda.pickupPointId}/${tanda.pickupDate}`}
        className={buttonStyles("outline", "sm", "mt-auto")}
      >
        <Truck aria-hidden="true" className="size-4" />
        Hoja de carga
      </Link>
    </li>
  );
}
