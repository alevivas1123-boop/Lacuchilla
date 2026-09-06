import inventario from "./provisional-images.json";

/**
 * INVENTARIO DE IMÁGENES PROVISORIAS
 * ==================================
 *
 * Los datos viven en `provisional-images.json` para que los lean tanto la
 * aplicación como el script de verificación previo al build, sin que queden
 * dos listas que se desincronicen. De este inventario salen tres cosas:
 *
 *   1. El aviso visible en desarrollo (`AvisoImagenesProvisorias`).
 *   2. El distintivo sobre cada foto provisoria en las tarjetas, en desarrollo.
 *   3. La verificación previa al build (`scripts/verificar-imagenes.mjs`), que
 *      corta un despliegue de producción mientras quede material provisorio.
 *
 * Cuando reemplaces una foto por una propia o con licencia comercial
 * verificada, BORRÁ su entrada del JSON. Cuando quede vacío, la verificación
 * deja de bloquear y el aviso desaparece solo.
 *
 * Ver IMAGE_REPLACEMENT_TODO.md para el detalle y el procedimiento.
 */

export type NivelAlerta = "bloqueante" | "licencia";

export interface ImagenProvisoria {
  /** Slug del producto, o "hero" para la portada. */
  slug: string;
  /** Ruta del archivo dentro de /public. */
  archivo: string;
  /** De dónde salió la imagen. */
  origen: string;
  /**
   * "bloqueante": además del tema de licencia, la foto tiene un problema
   * concreto de contenido y no puede mostrarse ni en una demo pública.
   * "licencia": la foto se ve bien, pero su licencia no está verificada.
   */
  nivel: NivelAlerta;
  /** Por qué hay que reemplazarla. */
  motivo: string;
}

export const IMAGENES_PROVISORIAS = inventario as ImagenProvisoria[];

/** Slugs con foto provisoria, para consultas rápidas desde los componentes. */
export const SLUGS_PROVISORIOS: ReadonlySet<string> = new Set(
  IMAGENES_PROVISORIAS.map((imagen) => imagen.slug),
);

export function esImagenProvisoria(slug: string): boolean {
  return SLUGS_PROVISORIOS.has(slug);
}

/** Las que además tienen un problema de contenido, no solo de licencia. */
export const BLOQUEANTES = IMAGENES_PROVISORIAS.filter(
  (imagen) => imagen.nivel === "bloqueante",
);

export const HAY_IMAGENES_PROVISORIAS = IMAGENES_PROVISORIAS.length > 0;
