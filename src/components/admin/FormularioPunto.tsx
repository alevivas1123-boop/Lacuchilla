"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

import { accionGuardarPunto } from "@/app/admin/actions-pedidos";
import { Field, inputClass } from "@/components/checkout/Field";
import { Button } from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/button-styles";
import { ESTADO_INICIAL } from "@/lib/admin-form-state";
import { cn } from "@/lib/cn";
import type { PickupPointRow } from "@/db/schema";
import { DIAS_SEMANA, fechaLegible, proximasFechas } from "@/lib/retiros";

export function FormularioPunto({ punto }: { punto?: PickupPointRow }) {
  const [estado, enviar, pendiente] = useActionState(accionGuardarPunto, ESTADO_INICIAL);
  const esEdicion = Boolean(punto);

  const error = (campo: string) => estado.errores?.[campo];
  /**
   * Primero lo que la persona acaba de escribir (React vacía el formulario al
   * terminar la acción), después lo que tiene el punto, y si no el valor por
   * defecto.
   */
  const valor = (campo: string, porDefecto: string | number = "") =>
    estado.valores?.[campo] ?? String(porDefecto);

  /*
   * Vista previa de las fechas. Se calcula durante el render a partir de lo
   * que hay en el formulario: sin esto, "jueves con 24 h de corte" es una
   * abstracción y recién se descubre el efecto cuando un cliente no puede
   * pedir.
   */
  const [dia, setDia] = useState(String(punto?.weekday ?? 4));
  const [desde, setDesde] = useState(punto?.timeFrom ?? "17:00");
  const [corte, setCorte] = useState(String(punto?.cutoffHours ?? 24));

  const vistaPrevia = /^([01]\d|2[0-3]):[0-5]\d$/.test(desde)
    ? proximasFechas(
        { weekday: Number(dia), timeFrom: desde, timeTo: desde, cutoffHours: Number(corte) || 0 },
        3,
      )
    : [];

  return (
    <form action={enviar} className="space-y-6">
      {punto ? <input type="hidden" name="id" value={punto.id} /> : null}

      <section className="space-y-5 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Dónde</h2>

        <Field id="name" label="Nombre del punto" required error={error("name")}>
          <input
            id="name"
            name="name"
            defaultValue={valor("name", punto?.name ?? "")}
            placeholder="Carrasco"
            className={inputClass}
            aria-invalid={Boolean(error("name"))}
            required
          />
        </Field>

        <Field id="address" label="Dirección" required error={error("address")}>
          <input
            id="address"
            name="address"
            defaultValue={valor("address", punto?.address ?? "")}
            placeholder="Av. Bolivia 1234, esquina Rivera"
            className={inputClass}
            aria-invalid={Boolean(error("address"))}
            required
          />
        </Field>

        <Field
          id="instructions"
          label="Cómo encontrarnos"
          hint="Se le muestra al cliente en la confirmación. Ej: frente a la plaza, camioneta blanca."
          error={error("instructions")}
        >
          <textarea
            id="instructions"
            name="instructions"
            rows={2}
            defaultValue={valor("instructions", punto?.instructions ?? "")}
            className={cn(inputClass, "min-h-20 py-3 leading-relaxed")}
            aria-invalid={Boolean(error("instructions"))}
          />
        </Field>
      </section>

      <section className="space-y-5 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Cuándo</h2>
        <p className="-mt-3 text-sm text-bark">
          Si el punto atiende dos días, cargá dos puntos. Así cada uno puede tener su horario.
        </p>

        <Field id="weekday" label="Día de la semana" required error={error("weekday")}>
          <select
            id="weekday"
            name="weekday"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className={cn(inputClass, "appearance-none")}
            aria-invalid={Boolean(error("weekday"))}
          >
            {DIAS_SEMANA.map((nombre, indice) => (
              <option key={nombre} value={indice}>
                {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="timeFrom" label="Desde" required error={error("timeFrom")}>
            <input
              id="timeFrom"
              name="timeFrom"
              type="time"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={inputClass}
              aria-invalid={Boolean(error("timeFrom"))}
              required
            />
          </Field>

          <Field id="timeTo" label="Hasta" required error={error("timeTo")}>
            <input
              id="timeTo"
              name="timeTo"
              type="time"
              defaultValue={valor("timeTo", punto?.timeTo ?? "19:00")}
              className={inputClass}
              aria-invalid={Boolean(error("timeTo"))}
              required
            />
          </Field>
        </div>

        <Field
          id="cutoffHours"
          label="Cerrar los pedidos"
          required
          hint="Cuántas horas antes del retiro dejás de aceptar pedidos, para tener tiempo de prepararlos."
          error={error("cutoffHours")}
        >
          <div className="flex items-center gap-3">
            <input
              id="cutoffHours"
              name="cutoffHours"
              type="number"
              inputMode="numeric"
              min={0}
              max={336}
              value={corte}
              onChange={(e) => setCorte(e.target.value)}
              className={cn(inputClass, "max-w-32")}
              aria-invalid={Boolean(error("cutoffHours"))}
              required
            />
            <span className="text-sm text-bark">horas antes</span>
          </div>
        </Field>

        <div className="rounded-xl bg-cream p-4">
          <p className="text-sm font-semibold text-ink">Con esta configuración se podría pedir para:</p>
          {vistaPrevia.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-bark">
              {vistaPrevia.map((fecha) => (
                <li key={fecha}>{fechaLegible(fecha)}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-bark">
              Ninguna fecha próxima. Revisá el día y las horas de corte.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-5 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Publicación</h2>

        <Field
          id="sortOrder"
          label="Orden"
          required
          hint="Los más chicos aparecen primero en el checkout."
          error={error("sortOrder")}
        >
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            defaultValue={valor("sortOrder", punto?.sortOrder ?? 0)}
            className={cn(inputClass, "max-w-32")}
            aria-invalid={Boolean(error("sortOrder"))}
            required
          />
        </Field>

        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="active"
            defaultChecked={
              estado.valores ? estado.valores.active === "true" : (punto?.active ?? true)
            }
            className="size-5 shrink-0 accent-[#4A2E1E]"
          />
          <span className="text-sm font-medium text-ink">
            Activo: se ofrece en el checkout
          </span>
        </label>
      </section>

      {estado.mensaje ? (
        <p
          role="alert"
          className="rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 px-4 py-3 text-sm font-medium text-ink"
        >
          {estado.mensaje}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" size="lg" disabled={pendiente} className="sm:w-auto">
          {pendiente ? (
            <>
              <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
              Guardando…
            </>
          ) : esEdicion ? (
            "Guardar cambios"
          ) : (
            "Crear punto"
          )}
        </Button>
        <Link href="/admin/puntos" className={buttonStyles("ghost", "lg")}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
