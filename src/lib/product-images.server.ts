import "server-only";
import fs from "node:fs";
import path from "node:path";

import { products } from "@/data/products";
import type { Product } from "@/lib/types";

const IMAGE_DIR = path.join(process.cwd(), "public", "products");
const IMAGE_EXTENSION = ".webp";

/**
 * Lee /public/products y devuelve los slugs que ya tienen su foto real.
 * Se evalúa en el servidor (build time para las páginas estáticas), así que
 * el navegador nunca pide una imagen que no existe: no hay imágenes rotas
 * ni errores 404 en consola.
 *
 * Para reemplazar un placeholder alcanza con dejar el archivo
 * /public/products/<slug>.webp y volver a construir.
 */
export function getAvailableProductImages(): string[] {
  try {
    return fs
      .readdirSync(IMAGE_DIR)
      .filter((file) => file.toLowerCase().endsWith(IMAGE_EXTENSION))
      .map((file) => file.slice(0, -IMAGE_EXTENSION.length));
  } catch {
    // La carpeta puede no existir todavía: se muestran todos los placeholders.
    return [];
  }
}

/** Catálogo con la marca `hasImage` ya resuelta. */
export function getProductsWithImages(): Product[] {
  const available = new Set(getAvailableProductImages());
  return products.map((product) => ({
    ...product,
    hasImage: available.has(product.slug),
  }));
}

/** ¿Existe un archivo dentro de /public? Ej: hasPublicFile("hero.webp"). */
export function hasPublicFile(relativePath: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", relativePath));
  } catch {
    return false;
  }
}
