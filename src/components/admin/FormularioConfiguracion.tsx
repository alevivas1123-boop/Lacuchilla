"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { accionGuardarConfiguracion } from "@/app/admin/actions-pedidos";
import { Field, inputClass } from "@/components/checkout/Field";
import { Button } from "@/components/ui/Button";
import { ESTADO_INICIAL } from "@/lib/admin-form-state";
import { cn } from "@/lib/cn";
import type { StoreSettingsRow } from "@/db/schema";

export function FormularioConfiguracion({ configuracion }: { configuracion: StoreSettingsRow }) {
  const [estado, enviar, pendiente] = useActionState(accionGuardarConfiguracion, ESTADO_INICIAL);

  const error = (campo: string) => estado.errores?.[campo];
  const valor = (campo: string, porDefecto: string | number | null = "") =>
    estado.valores?.[campo] ?? String(porDefecto ?? "");

  return (
    <form action={enviar} className="space-y-6">
      <section className="space-y-5 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Datos para transferir</h2>
          <p className="mt-1.5 text-sm text-bark">
            Es lo que ve el cliente apenas confirma la compra. Si está incompleto, nadie puede
            pagarte.
          </p>
        </div>

        <Field id="bankHolder" label="Titular de la cuenta" required error={error("bankHolder")}>
          <input
            id="bankHolder"
            name="bankHolder"
            defaultValue={valor("bankHolder", configuracion.bankHolder)}
            placeholder="María Pérez"
            className={inputClass}
            aria-invalid={Boolean(error("bankHolder"))}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="bankName" label="Banco" error={error("bankName")}>
            <input
              id="bankName"
              name="bankName"
              defaultValue={valor("bankName", configuracion.bankName)}
              placeholder="BROU"
              className={inputClass}
              aria-invalid={Boolean(error("bankName"))}
            />
          </Field>

          <Field id="bankAccountType" label="Tipo de cuenta" error={error("bankAccountType")}>
            <input
              id="bankAccountType"
              name="bankAccountType"
              defaultValue={valor("bankAccountType", configuracion.bankAccountType)}
              placeholder="Caja de ahorro en pesos"
              className={inputClass}
              aria-invalid={Boolean(error("bankAccountType"))}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="bankAccount" label="Número de cuenta" required error={error("bankAccount")}>
            <input
              id="bankAccount"
              name="bankAccount"
              defaultValue={valor("bankAccount", configuracion.bankAccount)}
              placeholder="001234567-00001"
              className={cn(inputClass, "font-mono")}
              aria-invalid={Boolean(error("bankAccount"))}
            />
          </Field>

          <Field
            id="bankDocument"
            label="Cédula o RUT"
            hint="Algunos bancos lo piden para transferir."
            error={error("bankDocument")}
          >
            <input
              id="bankDocument"
              name="bankDocument"
              defaultValue={valor("bankDocument", configuracion.bankDocument)}
              placeholder="1.234.567-8"
              className={cn(inputClass, "font-mono")}
              aria-invalid={Boolean(error("bankDocument"))}
            />
          </Field>
        </div>

        <Field
          id="bankInstructions"
          label="Nota para el cliente"
          hint="Se muestra debajo de los datos bancarios. Ej: poné tu número de pedido en la referencia."
          error={error("bankInstructions")}
        >
          <textarea
            id="bankInstructions"
            name="bankInstructions"
            rows={3}
            defaultValue={valor("bankInstructions", configuracion.bankInstructions)}
            className={cn(inputClass, "min-h-24 py-3 leading-relaxed")}
            aria-invalid={Boolean(error("bankInstructions"))}
          />
        </Field>
      </section>

      <section className="space-y-5 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Compra mínima</h2>

        <Field
          id="minimumOrder"
          label="Mínimo por pedido"
          hint="En pesos enteros. Dejalo vacío si no querés exigir un mínimo."
          error={error("minimumOrder")}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-bark">$</span>
            <input
              id="minimumOrder"
              name="minimumOrder"
              inputMode="numeric"
              defaultValue={valor("minimumOrder", configuracion.minimumOrder)}
              placeholder="500"
              className={cn(inputClass, "max-w-40")}
              aria-invalid={Boolean(error("minimumOrder"))}
            />
          </div>
        </Field>
      </section>

      {estado.mensaje ? (
        <p
          role="alert"
          className="rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 px-4 py-3 text-sm font-medium text-ink"
        >
          {estado.mensaje}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pendiente} className="sm:w-auto">
        {pendiente ? (
          <>
            <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
            Guardando…
          </>
        ) : (
          "Guardar configuración"
        )}
      </Button>
    </form>
  );
}
