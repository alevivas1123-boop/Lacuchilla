import { sql } from "drizzle-orm";

import type { BaseDeDatos } from "@/db/client";
import { pickupPoints, products, type NewPickupPointRow, type NewProductRow } from "@/db/schema";
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

/**
 * Los dos puntos de retiro con los que arranca la operación.
 *
 * Cuchilla Alta atiende el fin de semana, y eso son dos filas y no una: cada
 * día puede tener su horario, y la fecha del pedido tiene que poder ser el
 * sábado o el domingo, no "el fin de semana".
 *
 * El dueño los edita desde el panel; esto es solo el punto de partida para que
 * la tienda pueda vender el primer día.
 */
export const PUNTOS_INICIALES: NewPickupPointRow[] = [
  {
    name: "Carrasco",
    address: "Coordinamos el punto exacto por WhatsApp",
    weekday: 4, // jueves
    timeFrom: "17:00",
    timeTo: "19:00",
    cutoffHours: 24,
    instructions: "Te escribimos el mismo jueves para confirmar la esquina exacta.",
    active: true,
    sortOrder: 10,
  },
  {
    name: "Cuchilla Alta",
    address: "En el tambo, Cuchilla Alta",
    weekday: 6, // sábado
    timeFrom: "10:00",
    timeTo: "13:00",
    cutoffHours: 24,
    instructions: null,
    active: true,
    sortOrder: 20,
  },
  {
    name: "Cuchilla Alta",
    address: "En el tambo, Cuchilla Alta",
    weekday: 0, // domingo
    timeFrom: "10:00",
    timeTo: "13:00",
    cutoffHours: 24,
    instructions: null,
    active: true,
    sortOrder: 21,
  },
];

export interface ResultadoPuntos {
  insertados: number;
  total: number;
}

/**
 * Siembra los puntos de retiro.
 *
 * No hay clave natural para hacerlo idempotente por fila (dos puntos pueden
 * llamarse igual en días distintos), así que la regla es más simple y más
 * segura: si ya hay algún punto cargado, no se toca nada. El seed sirve para
 * arrancar, no para restaurar.
 */
export async function sembrarPuntos(db: BaseDeDatos): Promise<ResultadoPuntos> {
  const [conteo] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(pickupPoints);
  const existentes = Number(conteo?.total ?? 0);

  if (existentes > 0) return { insertados: 0, total: existentes };

  const insertados = await db
    .insert(pickupPoints)
    .values(PUNTOS_INICIALES)
    .returning({ id: pickupPoints.id });

  return { insertados: insertados.length, total: insertados.length };
}
