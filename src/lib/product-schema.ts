import { z } from "zod";

import { parsearPesos } from "@/lib/money";

/**
 * Validación del formulario de producto.
 *
 * Es la misma en el navegador y en el servidor, pero la que manda es la del
 * servidor: las acciones administrativas nunca confían en lo que llega del
 * cliente. La base repite las reglas críticas como CHECK.
 */

export const CATEGORIAS = ["quesos", "dulces", "otros"] as const;
export const TIPOS_DE_VENTA = ["weight", "unit"] as const;

/** Convierte un nombre en un slug limpio: "Queso Colonia" -> "queso-colonia". */
export function generarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

const precio = z
  .string()
  .trim()
  .min(1, "Escribí el precio.")
  .transform((valor, ctx) => {
    const pesos = parsearPesos(valor);
    if (pesos === null) {
      ctx.addIssue({
        code: "custom",
        message: "El precio va en pesos enteros, sin centésimos. Ej: 390.",
      });
      return z.NEVER;
    }
    if (pesos <= 0) {
      ctx.addIssue({ code: "custom", message: "El precio tiene que ser mayor que cero." });
      return z.NEVER;
    }
    return pesos;
  });

const entero = (mensaje: string) =>
  z
    .string()
    .trim()
    .min(1, mensaje)
    .transform((valor, ctx) => {
      if (!/^\d+$/.test(valor)) {
        ctx.addIssue({ code: "custom", message: "Tiene que ser un número entero." });
        return z.NEVER;
      }
      return Number(valor);
    });

export const productoSchema = z
  .object({
    name: z.string().trim().min(2, "El nombre es obligatorio.").max(160, "El nombre es muy largo."),
    slug: z
      .string()
      .trim()
      .min(2, "El slug es obligatorio.")
      .max(120, "El slug es muy largo.")
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Solo minúsculas, números y guiones. Ej: queso-colonia.",
      ),
    description: z.string().trim().max(600, "Máximo 600 caracteres.").optional(),
    category: z.enum(CATEGORIAS, { message: "Elegí una categoría." }),
    price: precio,
    saleType: z.enum(TIPOS_DE_VENTA, { message: "Elegí cómo se vende." }),
    unitLabel: z
      .string()
      .trim()
      .min(1, "Escribí cómo se llama la unidad. Ej: kg, unidad, frasco.")
      .max(24, "Máximo 24 caracteres."),
    minQuantity: entero("Escribí la cantidad mínima."),
    maxQuantity: entero("Escribí la cantidad máxima."),
    quantityStep: entero("Escribí el incremento."),
    presentation: z
      .string()
      .trim()
      .min(2, "Escribí la presentación. Ej: Venta por kilo, Frasco de 380 g.")
      .max(120, "Máximo 120 caracteres."),
    sortOrder: entero("Escribí el orden de aparición."),
    active: z.boolean(),
    imageAlt: z.string().trim().max(200, "Máximo 200 caracteres.").optional(),
    /** URL ya subida (Blob) o ruta existente en /public. Se valida aparte. */
    imageUrl: z.string().trim().max(2000).optional(),
    imageBlobPath: z.string().trim().max(2000).optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.minQuantity <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["minQuantity"],
        message: "La cantidad mínima tiene que ser mayor que cero.",
      });
    }
    if (datos.quantityStep <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityStep"],
        message: "El incremento tiene que ser mayor que cero.",
      });
    }
    if (datos.maxQuantity < datos.minQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["maxQuantity"],
        message: "El máximo no puede ser menor que el mínimo.",
      });
    }
  });

export type DatosProducto = z.infer<typeof productoSchema>;

/** Tipos de imagen aceptados. SVG queda deliberadamente afuera. */
export const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const;
export const TAMANO_MAXIMO_IMAGEN = 4 * 1024 * 1024; // 4 MB
