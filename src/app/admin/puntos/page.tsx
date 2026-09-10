import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";

import { accionCambiarEstadoPunto } from "@/app/admin/actions-pedidos";
import { BarraAdmin } from "@/components/admin/BarraAdmin";
import { BotonEstado } from "@/components/admin/BotonEstado";
import { buttonStyles } from "@/components/ui/button-styles";
import { listarPuntos } from "@/db/queries-pedidos";
import type { PickupPointRow } from "@/db/schema";
import { cn } from "@/lib/cn";
import { DIAS_SEMANA, fechaLegible, franjaHoraria, proximasFechas } from "@/lib/retiros";

export const metadata: Metadata = {
  title: "Puntos de retiro",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PuntosPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;

  let puntos: PickupPointRow[] = [];
  let errorBase: string | undefined;
  try {
    puntos = await listarPuntos();
  } catch {
    errorBase =
      "No se pudo conectar con la base de datos. Revisá la variable DATABASE_URL del entorno.";
  }

  return (
    <>
      <BarraAdmin />

      <main className="container-page flex-1 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Puntos de retiro
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-bark">
              Dónde y cuándo entregás. El cliente elige uno al comprar y después el pedido guarda
              esos datos, así cambiar un horario no altera los pedidos ya hechos.
            </p>
          </div>

          <Link href="/admin/puntos/nuevo" className={buttonStyles("primary", "md")}>
            <Plus aria-hidden="true" className="size-4.5" />
            Nuevo punto
          </Link>
        </div>

        {guardado ? (
          <p
            role="status"
            className="mt-5 rounded-card border-2 border-olive/30 bg-olive/10 px-4 py-3 text-sm font-medium text-ink"
          >
            Punto guardado.
          </p>
        ) : null}

        {errorBase ? (
          <p
            role="alert"
            className="mt-5 rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 px-4 py-3 text-sm font-medium text-ink"
          >
            {errorBase}
          </p>
        ) : null}

        {puntos.length === 0 && !errorBase ? (
          <div className="mt-6 rounded-card border border-ink/10 bg-card p-8 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-cheese/20 text-cheese-deep">
              <MapPin aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">
              Todavía no hay puntos de retiro
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-bark">
              Sin al menos un punto activo nadie puede terminar una compra: el checkout no tiene
              dónde entregar.
            </p>
            <Link href="/admin/puntos/nuevo" className={buttonStyles("primary", "lg", "mt-6")}>
              <Plus aria-hidden="true" className="size-4.5" />
              Crear el primero
            </Link>
          </div>
        ) : null}

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {puntos.map((punto) => (
            <TarjetaPunto key={punto.id} punto={punto} />
          ))}
        </ul>
      </main>
    </>
  );
}

function TarjetaPunto({ punto }: { punto: PickupPointRow }) {
  const proximas = punto.active
    ? proximasFechas(
        {
          weekday: punto.weekday,
          timeFrom: punto.timeFrom,
          timeTo: punto.timeTo,
          cutoffHours: punto.cutoffHours,
        },
        1,
      )
    : [];

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-card border bg-card p-5",
        punto.active ? "border-ink/10" : "border-ink/10 bg-card/60",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink break-words">{punto.name}</h2>
          {punto.active ? null : (
            <span className="rounded-full border border-ink/20 bg-ink/8 px-2.5 py-0.5 text-xs font-semibold text-bark">
              Dado de baja
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-bark break-words">{punto.address}</p>

        <dl className="mt-3 space-y-1.5 text-sm">
          <Dato
            etiqueta="Horario"
            valor={`${DIAS_SEMANA[punto.weekday]}, ${franjaHoraria(punto.timeFrom, punto.timeTo)}`}
          />
          <Dato etiqueta="Cierre de pedidos" valor={`${punto.cutoffHours} h antes`} />
          <Dato
            etiqueta="Próxima fecha"
            valor={proximas[0] ? fechaLegible(proximas[0]) : "Sin fechas disponibles"}
          />
        </dl>

        {punto.instructions ? (
          <p className="mt-3 rounded-xl bg-cream px-3.5 py-2.5 text-sm text-bark break-words">
            {punto.instructions}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-ink/8 pt-4">
        <Link href={`/admin/puntos/${punto.id}`} className={buttonStyles("outline", "sm")}>
          Editar
        </Link>
        <BotonEstado
          id={punto.id}
          nombre={punto.name}
          activo={punto.active}
          accion={accionCambiarEstadoPunto}
        />
      </div>
    </li>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4">
      <dt className="text-bark">{etiqueta}</dt>
      <dd className="font-medium text-ink">{valor}</dd>
    </div>
  );
}
