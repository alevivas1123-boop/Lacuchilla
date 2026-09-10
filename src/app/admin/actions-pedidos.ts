"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  actualizarPunto,
  cambiarEstadoPedido,
  cambiarEstadoPunto,
  crearPunto,
  guardarConfiguracion,
  obtenerPedido,
  obtenerPunto,
} from "@/db/queries-pedidos";
import type { EstadoFormulario } from "@/lib/admin-form-state";
import { requerirSesion } from "@/lib/admin-session";
import { esEstado, TRANSICIONES } from "@/lib/estados-pedido";
import { puntoSchema } from "@/lib/pickup-schema";
import { TAG_CONFIGURACION, TAG_PUNTOS } from "@/lib/retiros.server";
import { configuracionSchema } from "@/lib/settings-schema";

/**
 * Invalida lo que la tienda tiene cacheado de los puntos y la configuración.
 *
 * `updateTag` es la variante para acciones de servidor: expira la etiqueta de
 * inmediato, así el cambio se ve apenas se guarda.
 */
function invalidarRetiros() {
  updateTag(TAG_PUNTOS);
  updateTag(TAG_CONFIGURACION);
  revalidatePath("/checkout");
  revalidatePath("/admin/puntos");
}

/** Junta los errores de Zod en un mapa por campo. */
function erroresPorCampo(issues: { path: PropertyKey[]; message: string }[]) {
  const errores: Record<string, string> = {};
  for (const problema of issues) {
    const campo = String(problema.path[0] ?? "");
    if (campo && !errores[campo]) errores[campo] = problema.message;
  }
  return errores;
}

/** Copia lo escrito para poder repintarlo: React vacía el formulario al terminar. */
function valoresDe(formData: FormData, campos: string[], booleanos: string[] = []) {
  const valores: Record<string, string> = {};
  for (const campo of campos) valores[campo] = String(formData.get(campo) ?? "");
  for (const campo of booleanos) valores[campo] = formData.get(campo) ? "true" : "";
  return valores;
}

/* ── Puntos de retiro ────────────────────────────────────────────────────── */

const CAMPOS_PUNTO = [
  "name",
  "address",
  "weekday",
  "timeFrom",
  "timeTo",
  "cutoffHours",
  "instructions",
  "sortOrder",
];

export async function accionGuardarPunto(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await requerirSesion();
  } catch {
    return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };
  }

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const valores = valoresDe(formData, CAMPOS_PUNTO, ["active"]);

  const analisis = puntoSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    weekday: formData.get("weekday"),
    timeFrom: formData.get("timeFrom"),
    timeTo: formData.get("timeTo"),
    cutoffHours: formData.get("cutoffHours"),
    instructions: formData.get("instructions") || undefined,
    sortOrder: formData.get("sortOrder"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });

  if (!analisis.success) {
    return {
      ok: false,
      mensaje: "Revisá los campos marcados.",
      errores: erroresPorCampo(analisis.error.issues),
      valores,
    };
  }

  const datos = analisis.data;
  const fila = {
    name: datos.name,
    address: datos.address,
    weekday: datos.weekday,
    timeFrom: datos.timeFrom,
    timeTo: datos.timeTo,
    cutoffHours: datos.cutoffHours,
    instructions: datos.instructions ?? null,
    sortOrder: datos.sortOrder,
    active: datos.active,
  };

  try {
    if (id) {
      const existente = await obtenerPunto(id);
      if (!existente) return { ok: false, mensaje: "Ese punto ya no existe.", valores };
      await actualizarPunto(id, fila);
    } else {
      await crearPunto(fila);
    }
  } catch {
    // El error de la base no se devuelve tal cual: puede traer detalles internos.
    return { ok: false, mensaje: "No se pudo guardar el punto. Probá de nuevo.", valores };
  }

  invalidarRetiros();
  redirect("/admin/puntos?guardado=1");
}

export async function accionCambiarEstadoPunto(formData: FormData): Promise<void> {
  await requerirSesion();

  const id = String(formData.get("id") ?? "");
  const activar = String(formData.get("activar") ?? "") === "true";
  if (!id) return;

  await cambiarEstadoPunto(id, activar);
  invalidarRetiros();
}

/* ── Configuración ───────────────────────────────────────────────────────── */

const CAMPOS_CONFIGURACION = [
  "bankHolder",
  "bankName",
  "bankAccount",
  "bankAccountType",
  "bankDocument",
  "bankInstructions",
  "minimumOrder",
];

export async function accionGuardarConfiguracion(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  try {
    await requerirSesion();
  } catch {
    return { ok: false, mensaje: "Tu sesión venció. Volvé a entrar." };
  }

  const valores = valoresDe(formData, CAMPOS_CONFIGURACION);

  const analisis = configuracionSchema.safeParse({
    bankHolder: formData.get("bankHolder") ?? "",
    bankName: formData.get("bankName") ?? "",
    bankAccount: formData.get("bankAccount") ?? "",
    bankAccountType: formData.get("bankAccountType") ?? "",
    bankDocument: formData.get("bankDocument") ?? "",
    bankInstructions: formData.get("bankInstructions") ?? "",
    minimumOrder: formData.get("minimumOrder") ?? "",
  });

  if (!analisis.success) {
    return {
      ok: false,
      mensaje: "Revisá los campos marcados.",
      errores: erroresPorCampo(analisis.error.issues),
      valores,
    };
  }

  try {
    await guardarConfiguracion(analisis.data);
  } catch {
    return { ok: false, mensaje: "No se pudo guardar la configuración. Probá de nuevo.", valores };
  }

  invalidarRetiros();
  redirect("/admin/configuracion?guardado=1");
}

/* ── Estado de los pedidos ───────────────────────────────────────────────── */

export async function accionCambiarEstadoPedido(formData: FormData): Promise<void> {
  await requerirSesion();

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim().slice(0, 200) || undefined;
  if (!id || !esEstado(estado)) return;

  const actual = await obtenerPedido(id);
  if (!actual) return;

  // Un pedido ya entregado o cancelado no vuelve atrás, y no se saltan pasos
  // que la operación no contempla.
  if (!TRANSICIONES[actual.pedido.status].includes(estado)) return;

  await cambiarEstadoPedido(id, estado, motivo);

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/tandas", "layout");
}
