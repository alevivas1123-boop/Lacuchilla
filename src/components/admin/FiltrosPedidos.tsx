"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { ESTADOS, ETIQUETA_ESTADO } from "@/lib/estados-pedido";
import { fechaCorta } from "@/lib/retiros";

export interface OpcionDeTanda {
  puntoId: string;
  puntoNombre: string;
  fecha: string;
}

/** Buscador y filtros del panel. Escriben en la URL para poder compartir la vista. */
export function FiltrosPedidos({
  busqueda,
  estado,
  tanda,
  historico,
  tandas,
  total,
}: {
  busqueda: string;
  estado: string;
  tanda: string;
  historico: boolean;
  tandas: OpcionDeTanda[];
  total: number;
}) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [texto, setTexto] = useState(busqueda);

  // Se espera a que la persona deje de escribir antes de recargar el listado.
  useEffect(() => {
    if (texto === busqueda) return;
    const temporizador = window.setTimeout(() => {
      const nuevos = new URLSearchParams(parametros.toString());
      if (texto.trim()) nuevos.set("q", texto.trim());
      else nuevos.delete("q");
      router.replace(`/admin/pedidos?${nuevos.toString()}`);
    }, 350);
    return () => window.clearTimeout(temporizador);
  }, [texto, busqueda, parametros, router]);

  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(parametros.toString());
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    router.replace(`/admin/pedidos?${nuevos.toString()}`);
  }

  return (
    <section aria-label="Filtros" className="mt-6 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-bark"
          />
          <input
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Nombre, teléfono o número de pedido…"
            aria-label="Buscar pedidos"
            className="min-h-12 w-full rounded-xl border-2 border-ink/15 bg-card pr-3.5 pl-10 text-base text-ink placeholder:text-bark/55 hover:border-ink/30 focus:border-ink focus:outline-none"
          />
        </div>

        {tandas.length > 0 ? (
          <label className="flex items-center gap-2 text-sm font-medium text-bark">
            <span className="sr-only sm:not-sr-only">Tanda</span>
            <select
              value={tanda}
              onChange={(evento) => cambiar("tanda", evento.target.value)}
              aria-label="Filtrar por punto y fecha de retiro"
              className="min-h-12 w-full rounded-xl border-2 border-ink/15 bg-card px-3 text-base font-medium text-ink hover:border-ink/30 focus:border-ink focus:outline-none sm:w-auto"
            >
              <option value="">Todas las entregas</option>
              {tandas.map((opcion) => (
                <option
                  key={`${opcion.puntoId}|${opcion.fecha}`}
                  value={`${opcion.puntoId}|${opcion.fecha}`}
                >
                  {opcion.puntoNombre} · {fechaCorta(opcion.fecha)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          <Chip activo={estado === "todos"} onClick={() => cambiar("estado", "")}>
            Todos
          </Chip>
          {ESTADOS.map((opcion) => (
            <Chip
              key={opcion}
              activo={estado === opcion}
              onClick={() => cambiar("estado", opcion)}
            >
              {ETIQUETA_ESTADO[opcion]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Chip activo={historico} onClick={() => cambiar("historico", historico ? "" : "1")}>
          {historico ? "Viendo todo el historial" : "Ver también entregas pasadas"}
        </Chip>
        <p aria-live="polite" className="ml-auto text-sm text-bark">
          {total} {total === 1 ? "pedido" : "pedidos"}
        </p>
      </div>
    </section>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "min-h-11 rounded-full border-2 px-4 text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        activo
          ? "border-ink bg-ink text-cream"
          : "border-ink/15 bg-card text-ink hover:border-ink/45",
      )}
    >
      {children}
    </button>
  );
}
