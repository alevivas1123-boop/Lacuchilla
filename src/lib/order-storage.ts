"use client";

import type { Order } from "@/lib/types";

const ORDER_KEY = "la-cuchilla:last-order";

/**
 * El resumen del pedido se guarda en sessionStorage para poder mostrarlo en
 * /pedido-confirmado. Es temporal a propósito: en la fase 2 este paso lo
 * reemplaza una llamada al backend que persiste el pedido de verdad.
 */
export function saveLastOrder(order: Order): void {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // Modo privado o storage lleno: la confirmación mostrará el estado vacío.
  }
}

export function clearLastOrder(): void {
  try {
    sessionStorage.removeItem(ORDER_KEY);
  } catch {
    // Sin storage no hay nada que limpiar.
  }
}

/* ── Lectura con useSyncExternalStore ─────────────────────────────────────
   Se expone el JSON crudo (un string) para que el snapshot sea estable entre
   renders y React no entre en un bucle. */

export function subscribeToLastOrder(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Snapshot en el navegador: el JSON guardado, o null si no hay pedido. */
export function getLastOrderSnapshot(): string | null {
  try {
    return sessionStorage.getItem(ORDER_KEY);
  } catch {
    return null;
  }
}

/** Snapshot en el servidor: `undefined` significa "todavía no sabemos". */
export function getLastOrderServerSnapshot(): string | undefined {
  return undefined;
}

export function parseOrder(raw: string | null | undefined): Order | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Order;
  } catch {
    return null;
  }
}

/** Número de pedido simulado: LC-AAMMDD-XXXX. */
export function generateOrderNumber(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LC-${yy}${mm}${dd}-${random}`;
}
