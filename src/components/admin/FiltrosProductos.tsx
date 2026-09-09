"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CATEGORIES } from "@/lib/categorias";
import { cn } from "@/lib/cn";

const ESTADOS = [
  { id: "todos", label: "Todos" },
  { id: "activos", label: "Activos" },
  { id: "inactivos", label: "Inactivos" },
] as const;

/** Buscador y filtros. Escriben en la URL para que el listado sea compartible. */
export function FiltrosProductos({
  busqueda,
  categoria,
  estado,
  total,
}: {
  busqueda: string;
  categoria: string;
  estado: string;
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
      nuevos.delete("guardado");
      router.replace(`/admin?${nuevos.toString()}`);
    }, 350);
    return () => window.clearTimeout(temporizador);
  }, [texto, busqueda, parametros, router]);

  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(parametros.toString());
    if (valor && valor !== "todas" && valor !== "todos") nuevos.set(clave, valor);
    else nuevos.delete(clave);
    nuevos.delete("guardado");
    router.replace(`/admin?${nuevos.toString()}`);
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
            placeholder="Buscar por nombre…"
            aria-label="Buscar productos por nombre"
            className="min-h-12 w-full rounded-xl border-2 border-ink/15 bg-card pr-3.5 pl-10 text-base text-ink placeholder:text-bark/55 hover:border-ink/30 focus:border-ink focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-bark">
          <span className="sr-only sm:not-sr-only">Categoría</span>
          <select
            value={categoria}
            onChange={(evento) => cambiar("categoria", evento.target.value)}
            aria-label="Filtrar por categoría"
            className="min-h-12 rounded-xl border-2 border-ink/15 bg-card px-3 text-base font-medium text-ink hover:border-ink/30 focus:border-ink focus:outline-none"
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIES.filter((c) => c.id !== "todos").map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filtrar por estado" className="flex gap-2">
          {ESTADOS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => cambiar("estado", opcion.id)}
              aria-pressed={estado === opcion.id}
              className={cn(
                "min-h-11 rounded-full border-2 px-4 text-sm font-semibold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                estado === opcion.id
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/15 bg-card text-ink hover:border-ink/45",
              )}
            >
              {opcion.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="ml-auto text-sm text-bark">
          {total} {total === 1 ? "producto" : "productos"}
        </p>
      </div>
    </section>
  );
}
