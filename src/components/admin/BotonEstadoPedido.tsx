"use client";

import { BadgeCheck, Ban, Check, Loader2, PackageCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { buttonStyles } from "@/components/ui/button-styles";
import type { OrderStatus } from "@/db/schema";
import { ACCION_ESTADO } from "@/lib/estados-pedido";
import { cn } from "@/lib/cn";

const ICONO: Record<OrderStatus, typeof Check> = {
  pendiente_pago: Check,
  pagado: BadgeCheck,
  preparado: PackageCheck,
  entregado: Check,
  cancelado: Ban,
};

/**
 * Mueve un pedido a otro estado.
 *
 * Confirmar un pago no pide confirmación: el dueño lo hace con el banco
 * abierto al lado y viendo la plata, y un paso extra por pedido se paga en
 * tiempo real. Cancelar sí la pide, y además pide el motivo, porque es lo
 * único que no tiene vuelta atrás.
 */
export function BotonEstadoPedido({
  id,
  estado,
  accion,
  tamano = "md",
  className,
}: {
  id: string;
  estado: OrderStatus;
  accion: (formData: FormData) => Promise<void>;
  tamano?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();
  const Icono = ICONO[estado];
  const esCancelar = estado === "cancelado";

  function ejecutar() {
    const datos = new FormData();
    datos.set("id", id);
    datos.set("estado", estado);
    if (esCancelar && motivo.trim()) datos.set("motivo", motivo.trim());
    // La transición bloquea el botón: dos toques no disparan dos cambios.
    iniciarTransicion(async () => {
      await accion(datos);
      setConfirmando(false);
      setMotivo("");
    });
  }

  if (esCancelar && confirmando) {
    return (
      <div className="w-full space-y-2 rounded-xl border-2 border-[#9B3B1F]/30 bg-[#9B3B1F]/5 p-3">
        <label htmlFor={`motivo-${id}`} className="block text-sm font-semibold text-ink">
          ¿Por qué se cancela?
        </label>
        <input
          id={`motivo-${id}`}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={200}
          placeholder="No transfirió, se arrepintió, no lo retiró…"
          className="w-full min-h-11 rounded-xl border-2 border-ink/15 bg-cream px-3 text-base text-ink placeholder:text-bark/55 focus:border-ink focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={ejecutar}
            disabled={pendiente}
            className={buttonStyles("primary", "sm")}
          >
            {pendiente ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : null}
            Sí, cancelar
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={pendiente}
            className={buttonStyles("ghost", "sm")}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (esCancelar ? setConfirmando(true) : ejecutar())}
      disabled={pendiente}
      className={cn(
        buttonStyles(esCancelar ? "ghost" : estado === "pagado" ? "primary" : "outline", tamano),
        className,
      )}
    >
      {pendiente ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Icono aria-hidden="true" className="size-4" />
      )}
      {ACCION_ESTADO[estado]}
    </button>
  );
}
