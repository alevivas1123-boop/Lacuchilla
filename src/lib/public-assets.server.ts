import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * ¿Existe un archivo dentro de /public? Ej: hasPublicFile("hero.webp").
 *
 * Se evalúa en el servidor para no pedirle al navegador una imagen que no
 * está. Las fotos de producto ya no pasan por acá: su URL vive en la base y
 * puede apuntar tanto a /public como a Vercel Blob.
 */
export function hasPublicFile(relativePath: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", relativePath.replace(/^\//, "")));
  } catch {
    return false;
  }
}
