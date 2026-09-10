import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { baseDePrueba } from "./helpers/db";
import type { BaseDeDatos } from "@/db/client";
import { crearPunto, listarPedidos, obtenerPedido } from "@/db/queries-pedidos";
import { obtenerProductoPorSlug } from "@/db/queries";
import { sembrarCatalogo } from "@/db/seed";
import type { PickupPointRow } from "@/db/schema";
import { reiniciarLimites } from "@/lib/rate-limit";
import type { CartItem } from "@/lib/types";

/*
 * La acción del checkout contra PostgreSQL de verdad.
 *
 * Es la prueba que más importa: es el único camino por el que entra plata, y
 * el único donde el servidor tiene que desconfiar de todo lo que le mandan.
 * `getDb` apunta a la base efímera y `next/headers` se reemplaza porque la
 * acción corre fuera de una request.
 */
let db: BaseDeDatos;
let cerrar: () => Promise<void>;

vi.mock("@/db/client", async (original) => {
  const modulo = await original<typeof import("@/db/client")>();
  return { ...modulo, getDb: () => db };
});

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
}));

// `updateTag` exige el contexto de una acción de servidor real. Acá solo
// interesa que la acción lo llame; que expire de verdad lo prueba Next.
const etiquetasExpiradas: string[] = [];
vi.mock("next/cache", async (original) => ({
  ...(await original<typeof import("next/cache")>()),
  updateTag: (etiqueta: string) => etiquetasExpiradas.push(etiqueta),
}));

const correo = { falla: false, enviados: [] as string[] };
vi.mock("@/lib/email/confirmacion-de-pedido", () => ({
  enviarConfirmacionDePedido: async (pedido: { orderNumber: string }) => {
    if (correo.falla) throw new Error("el proveedor de correo está caído");
    correo.enviados.push(pedido.orderNumber);
    return { enviado: true, proveedor: "prueba" };
  },
}));

const { crearPedidoDesdeElCheckout } = await import("@/app/(tienda)/checkout/crear-pedido");

/** Un jueves de 2026, lejos del reloj real de la prueba. */
const JUEVES = "2026-09-17";

const CARRASCO = {
  name: "Carrasco",
  address: "Av. Bolivia 1234",
  weekday: 4,
  timeFrom: "17:00",
  timeTo: "19:00",
  cutoffHours: 24,
  sortOrder: 10,
};

let punto: PickupPointRow;

/** Los datos que manda el formulario, con lo que haga falta cambiado. */
function formulario(cambios: Record<string, unknown> = {}) {
  return {
    fullName: "Ana Rodríguez",
    phone: "099 123 456",
    email: "",
    pickupPointId: punto.id,
    pickupDate: JUEVES,
    notes: "",
    ...cambios,
  };
}

/** Una línea de carrito armada desde el catálogo sembrado. */
async function itemDelCarrito(slug: string, quantity: number, cambios: Partial<CartItem> = {}) {
  const producto = (await obtenerProductoPorSlug(slug, db))!;
  return {
    id: producto.slug,
    slug: producto.slug,
    name: producto.name,
    category: producto.category,
    saleType: producto.saleType,
    unitLabel: producto.unitLabel,
    presentation: producto.presentation,
    unitPrice: producto.price,
    quantity,
    minQuantity: producto.minQuantity,
    maxQuantity: producto.maxQuantity,
    quantityStep: producto.quantityStep,
    imageUrl: producto.imageUrl,
    ...cambios,
  } satisfies CartItem;
}

beforeEach(async () => {
  ({ db, cerrar } = await baseDePrueba());
  await sembrarCatalogo(db);
  punto = await crearPunto(CARRASCO, db);
  reiniciarLimites();
  correo.falla = false;
  correo.enviados = [];
  // El corte es de 24 h: se congela el reloj bastante antes del jueves.
  vi.setSystemTime(new Date("2026-09-14T12:00:00Z"));
});

afterEach(async () => {
  vi.useRealTimers();
  await cerrar();
});

describe("crear el pedido", () => {
  it("guarda el pedido con sus líneas y el total calculado en el servidor", async () => {
    const colonia = await itemDelCarrito("queso-colonia", 2);
    const resultado = await crearPedidoDesdeElCheckout(formulario(), [colonia]);

    expect(resultado.ok, JSON.stringify(resultado)).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.orderNumber).toMatch(/^LC-\d{6}-\d{4}$/);

    const guardado = (await obtenerPedido(resultado.id, db))!;
    expect(guardado.pedido.status).toBe("pendiente_pago");
    expect(guardado.pedido.total).toBe(colonia.unitPrice * 2);
    expect(guardado.pedido.paymentMethod).toBe("transferencia");
    expect(guardado.lineas).toHaveLength(1);
    expect(guardado.lineas[0].lineTotal).toBe(colonia.unitPrice * 2);
  });

  it("copia el punto en el pedido para que no dependa de la configuración de mañana", async () => {
    const item = await itemDelCarrito("queso-colonia", 1);
    const resultado = await crearPedidoDesdeElCheckout(formulario(), [item]);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    const { pedido } = (await obtenerPedido(resultado.id, db))!;
    expect(pedido.pickupPointName).toBe("Carrasco");
    expect(pedido.pickupAddress).toBe("Av. Bolivia 1234");
    expect(pedido.pickupTimeFrom).toBe("17:00");
    expect(pedido.pickupDate).toBe(JUEVES);
  });

  it("normaliza el teléfono y reusa el cliente entre pedidos", async () => {
    const item = await itemDelCarrito("queso-colonia", 1);
    const primero = await crearPedidoDesdeElCheckout(formulario(), [item]);
    const segundo = await crearPedidoDesdeElCheckout(
      formulario({ phone: "+598 99 123 456", fullName: "Ana R." }),
      [item],
    );
    expect(primero.ok && segundo.ok).toBe(true);
    if (!primero.ok || !segundo.ok) return;

    const uno = (await obtenerPedido(primero.id, db))!;
    const dos = (await obtenerPedido(segundo.id, db))!;
    expect(uno.pedido.customerPhone).toBe("59899123456");
    // Los dos teléfonos escritos distinto son la misma persona.
    expect(dos.pedido.customerId).toBe(uno.pedido.customerId);
  });
});

describe("la confirmación por correo", () => {
  it("se manda cuando el pedido se guardó bien", async () => {
    const item = await itemDelCarrito("queso-colonia", 1);
    const resultado = await crearPedidoDesdeElCheckout(
      formulario({ email: "ana@ejemplo.com" }),
      [item],
    );
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(correo.enviados).toEqual([resultado.orderNumber]);
  });

  it("un correo caído NO hace fallar la compra", async () => {
    // El pedido ya está guardado cuando se intenta mandar el correo. Que no
    // salga es una molestia; hacer fallar una compra por eso sería perder
    // plata, y el cliente igual ve los datos bancarios en pantalla.
    correo.falla = true;
    const item = await itemDelCarrito("queso-colonia", 1);
    const resultado = await crearPedidoDesdeElCheckout(
      formulario({ email: "ana@ejemplo.com" }),
      [item],
    );

    expect(resultado.ok, JSON.stringify(resultado)).toBe(true);
    // Y el pedido quedó de verdad en la base, no a medias.
    expect(await listarPedidos({}, db)).toHaveLength(1);
    if (!resultado.ok) return;
    const guardado = await obtenerPedido(resultado.id, db);
    expect(guardado?.pedido.status).toBe("pendiente_pago");
    expect(guardado?.lineas).toHaveLength(1);
  });
});

describe("lo que el servidor no se cree", () => {
  it("ignora el precio que manda el navegador", async () => {
    const colonia = await itemDelCarrito("queso-colonia", 1);
    const resultado = await crearPedidoDesdeElCheckout(formulario(), [
      { ...colonia, unitPrice: 1 },
    ]);

    // Un precio distinto del vigente no crea el pedido: se avisa y se pide
    // confirmar de nuevo, para que nadie compre a un precio que no vio.
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.avisos?.join(" ")).toMatch(/precio/i);
    expect(await listarPedidos({}, db)).toHaveLength(0);
  });

  it("ajusta una cantidad fuera de rango en vez de aceptarla", async () => {
    const colonia = await itemDelCarrito("queso-colonia", 1);
    const resultado = await crearPedidoDesdeElCheckout(formulario(), [
      { ...colonia, quantity: 9999 },
    ]);

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.avisos?.join(" ")).toMatch(/cantidad/i);
    expect(resultado.items?.[0].quantity).toBeLessThanOrEqual(colonia.maxQuantity ?? 9999);
  });

  it("rechaza un producto que no existe", async () => {
    const colonia = await itemDelCarrito("queso-colonia", 1);
    const resultado = await crearPedidoDesdeElCheckout(formulario(), [
      { ...colonia, slug: "queso-inventado" },
    ]);
    expect(resultado.ok).toBe(false);
    expect(await listarPedidos({}, db)).toHaveLength(0);
  });

  it("rechaza una fecha que no cae en el día del punto", async () => {
    const item = await itemDelCarrito("queso-colonia", 1);
    // 2026-09-18 es viernes; Carrasco atiende los jueves.
    const resultado = await crearPedidoDesdeElCheckout(
      formulario({ pickupDate: "2026-09-18" }),
      [item],
    );
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores?.pickupDate).toBeTruthy();
  });

  it("rechaza una fecha pasada el corte, aunque el navegador la ofrezca", async () => {
    const item = await itemDelCarrito("queso-colonia", 1);
    // El jueves 17 a las 17:00 en Uruguay son las 20:00 UTC; con 24 h de corte
    // los pedidos cierran el miércoles 16 a las 20:00 UTC.
    vi.setSystemTime(new Date("2026-09-16T20:01:00Z"));
    const resultado = await crearPedidoDesdeElCheckout(formulario(), [item]);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores?.pickupDate).toBeTruthy();
  });

  it("acepta justo antes del corte", async () => {
    const item = await itemDelCarrito("queso-colonia", 1);
    vi.setSystemTime(new Date("2026-09-16T19:59:00Z"));
    const resultado = await crearPedidoDesdeElCheckout(formulario(), [item]);
    expect(resultado.ok, JSON.stringify(resultado)).toBe(true);
  });

  it("rechaza un punto dado de baja", async () => {
    const item = await itemDelCarrito("queso-colonia", 1);
    const otro = await crearPunto({ ...CARRASCO, name: "Viejo", active: false }, db);
    const resultado = await crearPedidoDesdeElCheckout(
      formulario({ pickupPointId: otro.id }),
      [item],
    );
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores?.pickupPointId).toBeTruthy();
    // Si la lista que vio el cliente estaba vieja, se expira para que al
    // recargar vea los puntos reales y no quede eligiendo opciones muertas.
    expect(etiquetasExpiradas).toContain("puntos-de-retiro");
  });

  it("rechaza un carrito vacío", async () => {
    expect(await crearPedidoDesdeElCheckout(formulario(), [])).toMatchObject({ ok: false });
  });

  it("rechaza datos de contacto incompletos", async () => {
    const item = await itemDelCarrito("queso-colonia", 1);
    const resultado = await crearPedidoDesdeElCheckout(formulario({ fullName: "A" }), [item]);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores?.fullName).toBeTruthy();
  });
});
