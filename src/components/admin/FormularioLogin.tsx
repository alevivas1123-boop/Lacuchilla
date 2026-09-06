"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { accionIniciarSesion } from "@/app/admin/actions";
import { ESTADO_INICIAL } from "@/lib/admin-form-state";
import { Field, inputClass } from "@/components/checkout/Field";
import { Button } from "@/components/ui/Button";

export function FormularioLogin({
  volver,
  deshabilitado,
}: {
  volver?: string;
  deshabilitado?: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState(accionIniciarSesion, ESTADO_INICIAL);

  return (
    <form action={enviar} className="space-y-5">
      {volver ? <input type="hidden" name="volver" value={volver} /> : null}

      <Field id="usuario" label="Usuario" required>
        <input
          id="usuario"
          name="usuario"
          type="text"
          autoComplete="username"
          required
          autoFocus
          className={inputClass}
          disabled={deshabilitado}
        />
      </Field>

      <Field id="contrasena" label="Contraseña" required>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          disabled={deshabilitado}
        />
      </Field>

      {estado.mensaje ? (
        <p role="alert" className="text-sm font-medium text-[#9B3B1F]">
          {estado.mensaje}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pendiente || deshabilitado}>
        {pendiente ? (
          <>
            <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
