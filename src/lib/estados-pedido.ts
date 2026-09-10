import type { OrderStatus } from "@/db/schema";

/**
 * Estados del pedido y transiciones permitidas.
 *
 * Vive fuera de las acciones porque un archivo "use server" solo puede
 * exportar funciones async: cualquier constante o tipo tiene que estar aparte.
 *
 * Nada de esto le llega al cliente. Son estados internos para que el dueño
 * sepa qué cobró, qué armó y qué entregó.
 */

export const ESTADOS: OrderStatus[] = [
  "pendiente_pago",
  "pagado",
  "preparado",
  "entregado",
  "cancelado",
];

export const ETIQUETA_ESTADO: Record<OrderStatus, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  preparado: "Preparado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Cómo se llama el botón que lleva a ese estado. */
export const ACCION_ESTADO: Record<OrderStatus, string> = {
  pendiente_pago: "Volver a pendiente",
  pagado: "Confirmar pago",
  preparado: "Marcar preparado",
  entregado: "Marcar entregado",
  cancelado: "Cancelar pedido",
};

/**
 * Transiciones válidas.
 *
 * Los botones de la pantalla son una comodidad; quien decide qué cambio se
 * acepta es el servidor. Sin esta tabla, un formulario armado a mano podría
 * devolver a "pagado" un pedido ya cancelado.
 */
export const TRANSICIONES: Record<OrderStatus, OrderStatus[]> = {
  pendiente_pago: ["pagado", "cancelado"],
  pagado: ["preparado", "entregado", "cancelado"],
  preparado: ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

export function transicionesDe(estado: OrderStatus): OrderStatus[] {
  return TRANSICIONES[estado];
}

export function esEstado(valor: string): valor is OrderStatus {
  return (ESTADOS as string[]).includes(valor);
}

/** Clases del distintivo de estado, para que se distinga de un vistazo. */
export const COLOR_ESTADO: Record<OrderStatus, string> = {
  pendiente_pago: "border-cheese/60 bg-cheese/15 text-ink",
  pagado: "border-olive/50 bg-olive/15 text-ink",
  preparado: "border-olive/70 bg-olive/25 text-ink",
  entregado: "border-ink/25 bg-ink/8 text-bark",
  cancelado: "border-[#9B3B1F]/40 bg-[#9B3B1F]/10 text-[#9B3B1F]",
};
