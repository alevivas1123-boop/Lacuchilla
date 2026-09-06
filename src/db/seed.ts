import { sql } from "drizzle-orm";

import type { BaseDeDatos } from "@/db/client";
import { products, type NewProductRow } from "@/db/schema";
import { PRODUCTOS_INICIALES } from "@/data/seed-products";

/**
 * Siembra el catálogo inicial en PostgreSQL.
 *
 * Es idempotente por slug: si el producto ya existe no se toca. Eso importa
 * porque el administrador puede haber cambiado precios o fotos desde el panel,
 * y volver a correr el seed no debe pisarle el trabajo.
 *
 * Devuelve cuántos insertó y cuántos ya estaban.
 */
export interface ResultadoSeed {
  insertados: number;
  existentes: number;
  total: number;
}

export function filasDelSeed(): NewProductRow[] {
  return PRODUCTOS_INICIALES.map((producto, indice) => ({
    slug: producto.slug,
    name: producto.name,
    description: producto.description,
    category: producto.category,
    price: producto.price,
    currency: "UYU",
    saleType: producto.saleType,
    unitLabel: producto.unitLabel,
    minQuantity: producto.minQuantity,
    maxQuantity: producto.maxQuantity,
    quantityStep: producto.quantityStep,
    presentation: producto.presentation,
    imageUrl: producto.image,
    imageAlt: producto.alt,
    active: true,
    // Se deja hueco entre productos para poder intercalar sin renumerar todo.
    sortOrder: (indice + 1) * 10,
  }));
}

export async function sembrarCatalogo(db: BaseDeDatos): Promise<ResultadoSeed> {
  const filas = filasDelSeed();

  const insertadas = await db
    .insert(products)
    .values(filas)
    // La clave es el slug: si ya está, se deja como está.
    .onConflictDoNothing({ target: products.slug })
    .returning({ slug: products.slug });

  const [conteo] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products);

  return {
    insertados: insertadas.length,
    existentes: filas.length - insertadas.length,
    total: Number(conteo?.total ?? 0),
  };
}
