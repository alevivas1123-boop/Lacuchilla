import type { ProductCategory } from "@/lib/types";

/** Filtros del catálogo público. El orden es el que se ve en la tienda. */
export const CATEGORIES: { id: ProductCategory | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "quesos", label: "Quesos" },
  { id: "dulces", label: "Mermeladas y dulces" },
  { id: "otros", label: "Otros" },
];

export const NOMBRE_CATEGORIA: Record<ProductCategory, string> = {
  quesos: "Quesos",
  dulces: "Mermeladas y dulces",
  otros: "Otros",
};
