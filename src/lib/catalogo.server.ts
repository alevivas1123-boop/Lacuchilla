import "server-only";
import { unstable_cache } from "next/cache";

import { listarProductosPublicos } from "@/db/queries";
import { esImagenProvisoria } from "@/data/provisional-images";
import type { Producto } from "@/lib/types";

/** Etiqueta de caché del catálogo. El panel la invalida al guardar cambios. */
export const TAG_CATALOGO = "catalogo-productos";

export type ProductoDeTienda = Producto & { esProvisoria?: boolean };

/**
 * Catálogo público, cacheado y etiquetado.
 *
 * La caché evita golpear la base en cada visita; la etiqueta permite que un
 * cambio hecho en el panel se vea de inmediato, sin esperar a que expire nada
 * (las acciones administrativas llaman a revalidateTag).
 */
const leerCatalogo = unstable_cache(
  async (): Promise<Producto[]> => listarProductosPublicos(),
  ["catalogo-publico"],
  { tags: [TAG_CATALOGO], revalidate: 300 },
);

export async function obtenerCatalogo(): Promise<ProductoDeTienda[]> {
  const productos = await leerCatalogo();
  const enDesarrollo = process.env.NODE_ENV !== "production";
  return productos.map((producto) => ({
    ...producto,
    ...(enDesarrollo ? { esProvisoria: esImagenProvisoria(producto.slug) } : {}),
  }));
}
