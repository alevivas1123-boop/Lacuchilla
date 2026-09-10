import { beforeEach, afterEach, describe, expect, it } from "vitest";

import { baseDePrueba } from "./helpers/db";
import type { BaseDeDatos } from "@/db/client";
import { sembrarCatalogo } from "@/db/seed";
import { obtenerProductoPorSlug } from "@/db/queries";
import {
  asegurarCliente,
  cambiarEstadoPedido,
  crearPedido,
  crearPunto,
  guardarConfiguracion,
  hojaDeCarga,
  listarClientes,
  listarPedidos,
  listarPuntosActivos,
  listarTandas,
  obtenerConfiguracion,
  obtenerPedido,
  pedidosDeLaTanda,
  cambiarEstadoPunto,
} from "@/db/queries-pedidos";
import type { PickupPointRow } from "@/db/schema";

let db: BaseDeDatos;
let cerrar: () => Promise<void>;
let carrasco: PickupPointRow;

const CARRASCO = {
  name: "Carrasco",
  address: "Av. Bolivia 1234",
  weekday: 4,
  timeFrom: "17:00",
  timeTo: "19:00",
  cutoffHours: 24,
  sortOrder: 10,
};

async function pedidoDe(
  nombre: string,
  telefono: string,
  items: { slug: string; cantidad: number }[],
  fecha = "2026-09-17",
) {
  const lineas = [];
  let total = 0;
  for (const item of items) {
    const producto = (await obtenerProductoPorSlug(item.slug, db))!;
    lineas.push({
      productId: producto.id,
      productName: producto.name,
      productSlug: producto.slug,
      presentation: producto.presentation,
      unitLabel: producto.unitLabel,
      saleType: producto.saleType,
      unitPrice: producto.price,
      quantity: item.cantidad,
    });
    total += producto.price * item.cantidad;
  }
  return crearPedido(
    {
      orderNumber: `LC-${Math.random().toString(36).slice(2, 10)}`,
      cliente: { name: nombre, phone: telefono },
      punto: carrasco,
      pickupDate: fecha,
      total,
      lineas,
    },
    db,
  );
}

beforeEach(async () => {
  ({ db, cerrar } = await baseDePrueba());
  await sembrarCatalogo(db);
  carrasco = await crearPunto(CARRASCO, db);
});
afterEach(async () => {
  await cerrar();
});

describe("puntos de retiro", () => {
  it("se crean y se listan solo los activos", async () => {
    await crearPunto({ ...CARRASCO, name: "Cuchilla Alta", weekday: 6, active: false }, db);
    const activos = await listarPuntosActivos(db);
    expect(activos.map((p) => p.name)).toEqual(["Carrasco"]);
  });

  it("la baja es lógica: el punto sigue existiendo", async () => {
    await cambiarEstadoPunto(carrasco.id, false, db);
    expect(await listarPuntosActivos(db)).toHaveLength(0);
  });

  it("la base rechaza un día de la semana inválido", async () => {
    await expect(crearPunto({ ...CARRASCO, weekday: 9 }, db)).rejects.toThrow();
  });
});

describe("creación del pedido", () => {
  it("guarda el pedido con sus líneas y crea el cliente", async () => {
    const pedido = await pedidoDe("María Fernández", "099 123 456", [
      { slug: "queso-colonia", cantidad: 3 },
      { slug: "mermelada-higo", cantidad: 2 },
    ]);

    expect(pedido.status).toBe("pendiente_pago");
    expect(pedido.total).toBe(390 * 3 + 120 * 2);
    // El teléfono queda normalizado, venga como venga.
    expect(pedido.customerPhone).toBe("59899123456");

    const detalle = await obtenerPedido(pedido.id, db);
    expect(detalle!.lineas).toHaveLength(2);
    expect(detalle!.lineas.find((l) => l.productSlug === "queso-colonia")!.lineTotal).toBe(1170);
  });

  it("copia los datos del punto y del producto", async () => {
    const pedido = await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 1 }]);
    expect(pedido.pickupPointName).toBe("Carrasco");
    expect(pedido.pickupAddress).toBe("Av. Bolivia 1234");
    expect(pedido.pickupTimeFrom).toBe("17:00");
  });

  it("un cambio de precio posterior no altera el pedido ya hecho", async () => {
    const pedido = await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 2 }]);
    const { actualizarProducto } = await import("@/db/queries");
    const colonia = (await obtenerProductoPorSlug("queso-colonia", db))!;
    await actualizarProducto(colonia.id, { price: 999 }, db);

    const detalle = await obtenerPedido(pedido.id, db);
    expect(detalle!.lineas[0].unitPrice).toBe(390);
    expect(detalle!.pedido.total).toBe(780);
  });

  it("dos pedidos del mismo teléfono son el mismo cliente", async () => {
    await pedidoDe("María F", "099 123 456", [{ slug: "queso-colonia", cantidad: 1 }]);
    await pedidoDe("María Fernández", "+598 99 123 456", [{ slug: "queso-dambo", cantidad: 1 }]);

    const clientes = await listarClientes(undefined, db);
    expect(clientes).toHaveLength(1);
    expect(clientes[0].pedidos).toBe(2);
    // Vale el último nombre que dejó.
    expect(clientes[0].name).toBe("María Fernández");
  });

  it("no deja un pedido a medias si falla una línea", async () => {
    const colonia = (await obtenerProductoPorSlug("queso-colonia", db))!;
    await expect(
      crearPedido(
        {
          orderNumber: "LC-ROTO",
          cliente: { name: "Test", phone: "099000000" },
          punto: carrasco,
          pickupDate: "2026-09-17",
          total: 100,
          lineas: [
            {
              productId: colonia.id,
              productName: "Queso Colonia",
              productSlug: "queso-colonia",
              presentation: "Venta por kilo",
              unitLabel: "kg",
              saleType: "weight",
              unitPrice: 390,
              quantity: 0, // el CHECK de la base lo rechaza
            },
          ],
        },
        db,
      ),
    ).rejects.toThrow();

    expect(await listarPedidos({}, db)).toHaveLength(0);
  });
});

describe("estados", () => {
  it("confirmar el pago deja marca de cuándo fue", async () => {
    const pedido = await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 1 }]);
    expect(pedido.paidAt).toBeNull();

    const pagado = await cambiarEstadoPedido(pedido.id, "pagado", undefined, db);
    expect(pagado!.status).toBe("pagado");
    expect(pagado!.paidAt).toBeInstanceOf(Date);
  });

  it("cancelar guarda el motivo", async () => {
    const pedido = await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 1 }]);
    const cancelado = await cambiarEstadoPedido(pedido.id, "cancelado", "No transfirió", db);
    expect(cancelado!.cancelReason).toBe("No transfirió");
    expect(cancelado!.cancelledAt).toBeInstanceOf(Date);
  });

  it("los filtros del panel funcionan", async () => {
    const a = await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 1 }]);
    await pedidoDe("Beto", "099333444", [{ slug: "queso-dambo", cantidad: 1 }]);
    await cambiarEstadoPedido(a.id, "pagado", undefined, db);

    expect(await listarPedidos({ estado: "pagado" }, db)).toHaveLength(1);
    expect(await listarPedidos({ estado: "pendiente_pago" }, db)).toHaveLength(1);
    expect(await listarPedidos({ busqueda: "Ana" }, db)).toHaveLength(1);
    expect(await listarPedidos({ busqueda: "099333444" }, db)).toHaveLength(1);
    expect(await listarPedidos({ fecha: "2026-09-17" }, db)).toHaveLength(2);
  });
});

describe("hoja de carga de la tanda", () => {
  it("suma las cantidades por producto de los pedidos pagados", async () => {
    const a = await pedidoDe("Ana", "099111222", [
      { slug: "queso-colonia", cantidad: 3 },
      { slug: "dulce-de-leche", cantidad: 2 },
    ]);
    const b = await pedidoDe("Beto", "099333444", [{ slug: "queso-colonia", cantidad: 5 }]);
    // Este no pagó: no se lleva.
    await pedidoDe("Carla", "099555666", [{ slug: "queso-colonia", cantidad: 10 }]);

    await cambiarEstadoPedido(a.id, "pagado", undefined, db);
    await cambiarEstadoPedido(b.id, "pagado", undefined, db);

    const carga = await hojaDeCarga(carrasco.id, "2026-09-17", db);
    const colonia = carga.find((l) => l.productName === "Queso Colonia")!;
    expect(colonia.cantidad).toBe(8);
    expect(colonia.pedidos).toBe(2);
    expect(colonia.unitLabel).toBe("kg");

    expect(carga.find((l) => l.productName === "Dulce de leche")!.cantidad).toBe(2);
  });

  it("no mezcla tandas distintas", async () => {
    const a = await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 3 }], "2026-09-17");
    const b = await pedidoDe("Beto", "099333444", [{ slug: "queso-colonia", cantidad: 5 }], "2026-09-24");
    await cambiarEstadoPedido(a.id, "pagado", undefined, db);
    await cambiarEstadoPedido(b.id, "pagado", undefined, db);

    expect((await hojaDeCarga(carrasco.id, "2026-09-17", db))[0].cantidad).toBe(3);
    expect((await hojaDeCarga(carrasco.id, "2026-09-24", db))[0].cantidad).toBe(5);
  });

  it("lista los pedidos de la tanda con sus líneas", async () => {
    await pedidoDe("Zulma", "099111222", [{ slug: "queso-colonia", cantidad: 1 }]);
    await pedidoDe("Ana", "099333444", [
      { slug: "queso-dambo", cantidad: 2 },
      { slug: "mermelada-higo", cantidad: 1 },
    ]);

    const tanda = await pedidosDeLaTanda(carrasco.id, "2026-09-17", db);
    expect(tanda).toHaveLength(2);
    // Ordenados por nombre, para armar las bolsas en orden.
    expect(tanda[0].pedido.customerName).toBe("Ana");
    expect(tanda[0].lineas).toHaveLength(2);
  });

  it("el resumen de tandas cuenta pedidos y pendientes", async () => {
    const a = await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 1 }]);
    await pedidoDe("Beto", "099333444", [{ slug: "queso-colonia", cantidad: 1 }]);
    await cambiarEstadoPedido(a.id, "pagado", undefined, db);

    const tandas = await listarTandas(db, "2026-09-01");
    expect(tandas).toHaveLength(1);
    expect(tandas[0].pedidos).toBe(2);
    expect(tandas[0].pendientes).toBe(1);
    expect(tandas[0].total).toBe(780);
  });

  it("las tandas pasadas no aparecen", async () => {
    await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 1 }], "2026-09-17");
    expect(await listarTandas(db, "2026-10-01")).toHaveLength(0);
  });
});

describe("configuración", () => {
  it("devuelve una fila aunque nunca se haya guardado", async () => {
    const config = await obtenerConfiguracion(db);
    expect(config.id).toBe(1);
    expect(config.bankHolder).toBeNull();
  });

  it("guarda y sobreescribe sin duplicar la fila", async () => {
    await guardarConfiguracion({ bankHolder: "La Cuchilla SRL", bankName: "BROU" }, db);
    await guardarConfiguracion({ bankHolder: "La Cuchilla", bankAccount: "001234567" }, db);

    const config = await obtenerConfiguracion(db);
    expect(config.bankHolder).toBe("La Cuchilla");
    expect(config.bankAccount).toBe("001234567");
  });
});

describe("clientes", () => {
  it("solo cuenta como gastado lo que se cobró", async () => {
    const a = await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 1 }]);
    await pedidoDe("Ana", "099111222", [{ slug: "queso-colonia", cantidad: 1 }]);
    await cambiarEstadoPedido(a.id, "pagado", undefined, db);

    const [cliente] = await listarClientes(undefined, db);
    expect(cliente.pedidos).toBe(2);
    expect(cliente.gastado).toBe(390);
  });

  it("se busca por nombre o teléfono", async () => {
    await pedidoDe("María Fernández", "099123456", [{ slug: "queso-colonia", cantidad: 1 }]);
    await pedidoDe("Beto", "099999888", [{ slug: "queso-colonia", cantidad: 1 }]);

    expect(await listarClientes("maría", db)).toHaveLength(1);
    expect(await listarClientes("099123456", db)).toHaveLength(1);
    expect(await listarClientes("nadie", db)).toHaveLength(0);
  });
});

describe("asegurarCliente", () => {
  it("no duplica al mismo teléfono escrito distinto", async () => {
    const a = await asegurarCliente({ name: "Ana", phone: "099 111 222" }, db);
    const b = await asegurarCliente({ name: "Ana P", phone: "+598 99 111 222" }, db);
    expect(a).toBe(b);
  });
});
