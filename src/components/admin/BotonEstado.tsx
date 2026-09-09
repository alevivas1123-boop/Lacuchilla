"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { buttonStyles } from "@/components/ui/button-styles";

/**
 * Da de baja o reactiva un producto.
 *
 * La baja pide confirmación porque saca el producto de la tienda. Nunca borra
 * la fila: solo cambia `active`, así el registro sigue disponible para los
 * pedidos que puedan referenciarlo más adelante.
 */
export function BotonEstado({
  id,
  nombre,
  activo,
  accion,
}: {
  id: string;
  nombre: string;
  activo: boolean;
  accion: (formData: FormData) => Promise<void>;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();

  function ejecutar() {
    const datos = new FormData();
    datos.set("id", id);
    datos.set("activar", String(!activo));
    // La transición bloquea el botón: dos clics no disparan dos cambios.
    iniciarTransicion(async () => {
      await accion(datos);
      setConfirmando(false);
    });
  }

  if (activo && confirmando) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-sm text-bark">¿Dar de baja «{nombre}»?</span>
        <button
          type="button"
          onClick={ejecutar}
          disabled={pendiente}
          className={buttonStyles("primary", "sm")}
        >
          {pendiente ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : null}
          Sí, dar de baja
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={pendiente}
          className={buttonStyles("ghost", "sm")}
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (activo ? setConfirmando(true) : ejecutar())}
      disabled={pendiente}
      className={buttonStyles(activo ? "ghost" : "secondary", "sm")}
    >
      {pendiente ? (
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
      ) : activo ? (
        <EyeOff aria-hidden="true" className="size-3.5" />
      ) : (
        <Eye aria-hidden="true" className="size-3.5" />
      )}
      {activo ? "Dar de baja" : "Reactivar"}
    </button>
  );
}
