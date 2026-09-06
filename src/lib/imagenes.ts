import { TAMANO_MAXIMO_IMAGEN, TIPOS_IMAGEN_PERMITIDOS } from "@/lib/product-schema";

/**
 * Validación de imágenes subidas desde el panel.
 *
 * No alcanza con mirar la extensión ni el Content-Type que declara el
 * navegador: los dos los controla quien sube el archivo. Se leen los primeros
 * bytes y se compara con la firma real del formato.
 */

export type TipoImagen = (typeof TIPOS_IMAGEN_PERMITIDOS)[number];

/** Detecta el formato real por los bytes iniciales del archivo. */
export function detectarTipoReal(bytes: Uint8Array): TipoImagen | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, i) => bytes[i] === byte)) return "image/png";

  // WebP: "RIFF" .... "WEBP"
  const texto = (desde: number, largo: number) =>
    String.fromCharCode(...bytes.slice(desde, desde + largo));
  if (texto(0, 4) === "RIFF" && texto(8, 4) === "WEBP") return "image/webp";

  return null;
}

export interface ImagenValidada {
  ok: boolean;
  error?: string;
  tipo?: TipoImagen;
  extension?: string;
}

const EXTENSION: Record<TipoImagen, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validarImagen(nombre: string, tamano: number, bytes: Uint8Array): ImagenValidada {
  if (tamano === 0) return { ok: false, error: "El archivo está vacío." };
  if (tamano > TAMANO_MAXIMO_IMAGEN) {
    return {
      ok: false,
      error: `La imagen supera los ${Math.round(TAMANO_MAXIMO_IMAGEN / (1024 * 1024))} MB.`,
    };
  }

  const tipo = detectarTipoReal(bytes);
  if (!tipo) {
    return {
      ok: false,
      error: "El archivo no es una imagen JPG, PNG o WebP válida.",
    };
  }

  // La extensión declarada tiene que ser coherente con el contenido real.
  const extensionDeclarada = nombre.split(".").pop()?.toLowerCase() ?? "";
  const coherente =
    (tipo === "image/jpeg" && ["jpg", "jpeg"].includes(extensionDeclarada)) ||
    (tipo === "image/png" && extensionDeclarada === "png") ||
    (tipo === "image/webp" && extensionDeclarada === "webp");
  if (!coherente) {
    return { ok: false, error: "La extensión del archivo no coincide con su contenido." };
  }

  return { ok: true, tipo, extension: EXTENSION[tipo] };
}

/**
 * Nombre de archivo impredecible: slug + azar. Evita colisiones y que alguien
 * pueda adivinar la URL de una imagen que todavía no se publicó.
 */
export function rutaEnBlob(slug: string, extension: string): string {
  const azar = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `productos/${slug}-${azar}.${extension}`;
}
