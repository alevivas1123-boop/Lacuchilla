import { eq } from "drizzle-orm";
import { beforeEach, afterEach, describe, expect, it } from "vitest";

import { baseDePrueba } from "./helpers/db";
import type { BaseDeDatos } from "@/db/client";
import { products } from "@/db/schema";
import { filasDelSeed, sembrarCatalogo } from "@/db/seed";
import {
  cambiarEstado,
  crearProducto,
  listarProductosAdmin,
  listarProductosPublicos,
  obtenerProductoPorSlug,
  slugDisponible,
} from "@/db/queries";

let db: BaseDeDatos;
let cerrar: () => Promise<void>;

beforeEach(async () => {
  ({ db, cerrar } = await baseDePrueba());
});
afterEach(async () => {
  await cerrar();
});

describe("migración y seed", () => {
  it("la migración crea la tabla y el seed carga los 17 productos", async () => {
    const resultado = await sembrarCatalogo(db);
    expect(resultado.insertados).toBe(17);
    expect(resultado.total).toBe(17);
  });

  it("el seed corrido dos veces no duplica datos", async () => {
    await sembrarCatalogo(db);
    const segunda = await sembrarCatalogo(db);
    expect(segunda.insertados).toBe(0);
    expect(segunda.existentes).toBe(17);
    expect(segunda.total).toBe(17);
  });

  it("el seed no pisa cambios hechos desde el panel", async () => {
    await sembrarCatalogo(db);
    const antes = await obtenerProductoPorSlug("queso-colonia", db);
    await db
      .update(products)
      .set({ price: 999 })
      .where(eq(products.slug, "queso-colonia"));

    await sembrarCatalogo(db);

    const despues = await obtenerProductoPorSlug("queso-colonia", db);
    expect(antes?.price).toBe(390);
    expect(despues?.price).toBe(999);
  });

  it("conserva slugs, precios y orden del catálogo original", async () => {
    await sembrarCatalogo(db);
    const publicos = await listarProductosPublicos(db);

    expect(publicos[0].slug).toBe("queso-colonia");
    expect(publicos[0].price).toBe(390);
    expect(publicos.map((p) => p.slug)).toContain("chorizo-chacarero");
    expect(publicos.every((p) => p.currency === "UYU")).toBe(true);

    const ordenes = publicos.map((p) => p.sortOrder);
    expect([...ordenes].sort((a, b) => a - b)).toEqual(ordenes);
  });

  it("los quesos por peso quedan de 1 a 5 kg y los de unidad con su propia configuración", async () => {
    await sembrarCatalogo(db);
    const colonia = await obtenerProductoPorSlug("queso-colonia", db);
    const mermelada = await obtenerProductoPorSlug("mermelada-higo", db);

    expect(colonia).toMatchObject({
      saleType: "weight",
      unitLabel: "kg",
      minQuantity: 1,
      maxQuantity: 5,
      quantityStep: 1,
    });
    expect(mermelada).toMatchObject({ saleType: "unit", unitLabel: "unidad", minQuantity: 1 });
    expect(mermelada!.maxQuantity).toBeGreaterThan(5);
  });
});

describe("reglas de la base", () => {
  it("rechaza un slug duplicado", async () => {
    await sembrarCatalogo(db);
    await expect(
      crearProducto(
        { ...filasDelSeed()[0], sortOrder: 999 },
        db,
      ),
    ).rejects.toThrow();
  });

  it("rechaza un precio de cero o negativo", async () => {
    await expect(
      crearProducto({ ...filasDelSeed()[0], price: 0 }, db),
    ).rejects.toThrow();
  });

  it("rechaza un rango de cantidades inválido", async () => {
    await expect(
      crearProducto({ ...filasDelSeed()[0], minQuantity: 5, maxQuantity: 2 }, db),
    ).rejects.toThrow();
  });

  it("slugDisponible detecta ocupados y permite editar el propio", async () => {
    await sembrarCatalogo(db);
    const colonia = await obtenerProductoPorSlug("queso-colonia", db);

    expect(await slugDisponible("queso-colonia", undefined, db)).toBe(false);
    expect(await slugDisponible("queso-colonia", colonia!.id, db)).toBe(true);
    expect(await slugDisponible("slug-libre-nuevo", undefined, db)).toBe(true);
  });
});

describe("baja lógica", () => {
  it("un producto dado de baja desaparece de la tienda pero sigue en la base", async () => {
    await sembrarCatalogo(db);
    const colonia = await obtenerProductoPorSlug("queso-colonia", db);

    await cambiarEstado(colonia!.id, false, db);

    const publicos = await listarProductosPublicos(db);
    expect(publicos.map((p) => p.slug)).not.toContain("queso-colonia");
    expect(publicos).toHaveLength(16);

    const enPanel = await listarProductosAdmin({ estado: "todos" }, db);
    expect(enPanel).toHaveLength(17);

    await cambiarEstado(colonia!.id, true, db);
    expect((await listarProductosPublicos(db)).map((p) => p.slug)).toContain("queso-colonia");
  });

  it("los filtros del panel funcionan", async () => {
    await sembrarCatalogo(db);
    expect(await listarProductosAdmin({ categoria: "dulces" }, db)).toHaveLength(5);
    expect(await listarProductosAdmin({ busqueda: "colonia" }, db)).toHaveLength(1);
    // La búsqueda no distingue mayúsculas y es por subcadena: "queso" también
    // aparece dentro de "Pizza cuatro quesos".
    expect(await listarProductosAdmin({ busqueda: "QUESO" }, db)).toHaveLength(11);
  });
});
