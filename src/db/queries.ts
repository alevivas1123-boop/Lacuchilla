import "server-only";
import { and, asc, eq, ilike, ne, sql } from "drizzle-orm";

import { getDb, type BaseDeDatos } from "@/db/client";
import { products, type NewProductRow, type ProductRow } from "@/db/schema";
import { aProductoPublico, type Producto, type ProductCategory } from "@/lib/types";

/**
 * Todas las consultas reciben la base como primer argumento opcional. En la
 * aplicación se omite y se usa la conexión real; en las pruebas se inyecta una
 * base efímera. Drizzle parametriza todo, así que no hay SQL armado a mano.
 */

export class BaseDeDatosNoDisponible extends Error {
  constructor(causa: unknown) {
    super("No se pudo consultar la base de datos.");
    this.name = "BaseDeDatosNoDisponible";
    this.cause = causa;
  }
}

/** Catálogo público: solo productos activos, en el orden configurado. */
export async function listarProductosPublicos(db: BaseDeDatos = getDb()): Promise<Producto[]> {
  try {
    const filas = await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.sortOrder), asc(products.name));
    return filas.map(aProductoPublico);
  } catch (error) {
    throw new BaseDeDatosNoDisponible(error);
  }
}

export interface FiltrosAdmin {
  busqueda?: string;
  categoria?: ProductCategory | "todas";
  estado?: "activos" | "inactivos" | "todos";
}

/** Listado del panel: incluye inactivos y admite búsqueda y filtros. */
export async function listarProductosAdmin(
  filtros: FiltrosAdmin = {},
  db: BaseDeDatos = getDb(),
): Promise<ProductRow[]> {
  const condiciones = [];
  if (filtros.busqueda && filtros.busqueda.trim() !== "") {
    condiciones.push(ilike(products.name, `%${filtros.busqueda.trim()}%`));
  }
  if (filtros.categoria && filtros.categoria !== "todas") {
    condiciones.push(eq(products.category, filtros.categoria));
  }
  if (filtros.estado === "activos") condiciones.push(eq(products.active, true));
  if (filtros.estado === "inactivos") condiciones.push(eq(products.active, false));

  try {
    return await db
      .select()
      .from(products)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(asc(products.sortOrder), asc(products.name));
  } catch (error) {
    throw new BaseDeDatosNoDisponible(error);
  }
}

export async function obtenerProductoPorId(
  id: string,
  db: BaseDeDatos = getDb(),
): Promise<ProductRow | undefined> {
  const [fila] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return fila;
}

export async function obtenerProductoPorSlug(
  slug: string,
  db: BaseDeDatos = getDb(),
): Promise<ProductRow | undefined> {
  const [fila] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return fila;
}

/** ¿El slug está libre? `exceptoId` permite editar un producto sin chocar consigo mismo. */
export async function slugDisponible(
  slug: string,
  exceptoId?: string,
  db: BaseDeDatos = getDb(),
): Promise<boolean> {
  const condicion = exceptoId
    ? and(eq(products.slug, slug), ne(products.id, exceptoId))
    : eq(products.slug, slug);
  const filas = await db.select({ id: products.id }).from(products).where(condicion).limit(1);
  return filas.length === 0;
}

export async function crearProducto(
  datos: NewProductRow,
  db: BaseDeDatos = getDb(),
): Promise<ProductRow> {
  const [fila] = await db.insert(products).values(datos).returning();
  return fila;
}

export async function actualizarProducto(
  id: string,
  datos: Partial<NewProductRow>,
  db: BaseDeDatos = getDb(),
): Promise<ProductRow | undefined> {
  const [fila] = await db
    .update(products)
    .set({ ...datos, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return fila;
}

/** Baja y alta lógica. Nunca se borra la fila. */
export async function cambiarEstado(
  id: string,
  active: boolean,
  db: BaseDeDatos = getDb(),
): Promise<ProductRow | undefined> {
  const [fila] = await db
    .update(products)
    .set({ active, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return fila;
}

/** Siguiente lugar libre en el orden del catálogo. */
export async function siguienteOrden(db: BaseDeDatos = getDb()): Promise<number> {
  const [fila] = await db
    .select({ maximo: sql<number>`coalesce(max(${products.sortOrder}), 0)` })
    .from(products);
  return Number(fila?.maximo ?? 0) + 10;
}
