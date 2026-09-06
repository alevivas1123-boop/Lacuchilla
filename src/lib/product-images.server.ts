import "server-only";
import fs from "node:fs";
import path from "node:path";

import { products } from "@/data/products";
import type { Product } from "@/lib/types";

/**
 * Comprueba en el servidor qué productos tienen su foto realmente en disco.
 * Se evalúa al construir el sitio, así el navegador nunca pide una imagen que
 * no existe: no hay imágenes rotas ni errores 404 en consola. Un producto sin
 * foto cae en el placeholder de marca.
 */
function existeEnPublic(rutaPublica: string): boolean {
  try {
    const relativa = rutaPublica.replace(/^\//, "");
    return fs.existsSync(path.join(process.cwd(), "public", relativa));
  } catch {
    return false;
  }
}

/** Slugs cuya foto está disponible. */
export function getAvailableProductImages(): string[] {
  return products.filter((p) => existeEnPublic(p.image)).map((p) => p.slug);
}

/** Catálogo con la marca `hasImage` ya resuelta. */
export function getProductsWithImages(): Product[] {
  return products.map((product) => ({
    ...product,
    hasImage: existeEnPublic(product.image),
  }));
}

/** ¿Existe un archivo dentro de /public? Ej: hasPublicFile("hero.webp"). */
export function hasPublicFile(relativePath: string): boolean {
  return existeEnPublic(relativePath);
}
