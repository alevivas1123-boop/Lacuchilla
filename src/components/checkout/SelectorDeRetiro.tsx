"use client";

import { Check, MapPin } from "lucide-react";

import { cn } from "@/lib/cn";
import { fechaLegible, franjaHoraria, type PuntoParaElegir } from "@/lib/retiros";

interface SelectorDeRetiroProps {
  puntos: PuntoParaElegir[];
  puntoElegido: string;
  fechaElegida: string;
  onElegirPunto: (id: string) => void;
  onElegirFecha: (fecha: string) => void;
  errorPunto?: string;
  errorFecha?: string;
}

/**
 * Dónde y cuándo se retira el pedido.
 *
 * Son dos decisiones encadenadas: el punto define qué fechas existen, así que
 * las fechas aparecen recién cuando hay un punto elegido. Se muestran como
 * tarjetas y no como un desplegable porque hay dos o tres opciones y cada una
 * necesita dirección, día y horario para poder decidir.
 */
export function SelectorDeRetiro({
  puntos,
  puntoElegido,
  fechaElegida,
  onElegirPunto,
  onElegirFecha,
  errorPunto,
  errorFecha,
}: SelectorDeRetiroProps) {
  const punto = puntos.find((candidato) => candidato.id === puntoElegido);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">
          ¿Dónde lo retirás?
          <span aria-hidden="true" className="ml-0.5 text-cheese-deep">
            *
          </span>
        </legend>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {puntos.map((opcion) => {
            const elegido = opcion.id === puntoElegido;
            return (
              <label
                key={opcion.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors",
                  "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
                  elegido ? "border-ink bg-cream" : "border-ink/15 bg-cream/60 hover:border-ink/40",
                )}
              >
                <input
                  type="radio"
                  name="pickupPointId"
                  value={opcion.id}
                  checked={elegido}
                  onChange={() => onElegirPunto(opcion.id)}
                  className="mt-1 size-4.5 shrink-0 accent-[#4A2E1E]"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink break-words">{opcion.name}</span>
                  <span className="mt-0.5 flex items-start gap-1.5 text-sm text-bark">
                    <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    <span className="break-words">{opcion.address}</span>
                  </span>
                  <span className="mt-1 block text-sm text-bark">
                    {franjaHoraria(opcion.timeFrom, opcion.timeTo)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {errorPunto ? (
          <p role="alert" className="mt-2 text-sm font-medium text-[#9B3B1F]">
            {errorPunto}
          </p>
        ) : null}
      </fieldset>

      {punto ? (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">
            ¿Qué día pasás?
            <span aria-hidden="true" className="ml-0.5 text-cheese-deep">
              *
            </span>
          </legend>
          <p className="mt-1 text-xs text-bark">
            Preparamos los pedidos por día, así que necesitamos saber cuál.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {punto.fechas.map((fecha) => {
              const elegida = fecha === fechaElegida;
              return (
                <label
                  key={fecha}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm font-medium transition-colors",
                    "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
                    elegida
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/15 bg-cream/60 text-ink hover:border-ink/40",
                  )}
                >
                  <input
                    type="radio"
                    name="pickupDate"
                    value={fecha}
                    checked={elegida}
                    onChange={() => onElegirFecha(fecha)}
                    className="sr-only"
                  />
                  {elegida ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
                  {fechaLegible(fecha)}
                </label>
              );
            })}
          </div>

          {errorFecha ? (
            <p role="alert" className="mt-2 text-sm font-medium text-[#9B3B1F]">
              {errorFecha}
            </p>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  );
}
