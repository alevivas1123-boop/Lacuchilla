import type { Product, ProductCategory } from "@/lib/types";

/** Opciones de peso para los productos que se venden por kilo. */
export const WEIGHT_OPTIONS = [1, 2, 3, 4, 5];

export const CATEGORIES: { id: ProductCategory | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "quesos", label: "Quesos" },
  { id: "dulces", label: "Mermeladas y dulces" },
  { id: "otros", label: "Otros" },
];

/**
 * Catálogo de La Cuchilla.
 *
 * Precios en pesos uruguayos.
 * - saleUnit "kg"   -> `price` es el precio por kilo y se elige el peso (1 a 5 kg).
 * - saleUnit "unit" -> `price` es el precio por unidad y se elige la cantidad.
 *
 * Para agregar un producto: copiá un objeto, cambiá el slug (único, en minúsculas
 * y con guiones) y agregá la foto en /public/products/<slug>.webp.
 */
export const products: Product[] = [
  // ── Quesos ────────────────────────────────────────────────────────────────
  {
    slug: "queso-colonia",
    name: "Queso Colonia",
    category: "quesos",
    saleUnit: "kg",
    price: 390,
    presentation: "Venta por kilo",
    description:
      "Clásico uruguayo de pasta semidura, cremoso y parejo. El de todos los días.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-dambo",
    name: "Queso Dambo",
    category: "quesos",
    saleUnit: "kg",
    price: 370,
    presentation: "Venta por kilo",
    description:
      "Suave, elástico y de sabor amable. Ideal para sándwiches y picadas.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-magro-con-sal",
    name: "Queso magro con sal",
    category: "quesos",
    saleUnit: "kg",
    price: 340,
    presentation: "Venta por kilo",
    description: "Bajo en grasa, firme y con el punto justo de sal.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-magro-sin-sal",
    name: "Queso magro sin sal",
    category: "quesos",
    saleUnit: "kg",
    price: 340,
    presentation: "Venta por kilo",
    description:
      "La versión sin sal agregada, pensada para dietas cuidadas.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-mozzarella",
    name: "Queso mozzarella",
    category: "quesos",
    saleUnit: "kg",
    price: 390,
    presentation: "Venta por kilo",
    description: "Funde parejo y estira como corresponde. Para pizza y horno.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-semiduro",
    name: "Queso semiduro",
    category: "quesos",
    saleUnit: "kg",
    price: 360,
    presentation: "Venta por kilo",
    description: "De maduración media, sabor redondo y textura compacta.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-parmesano",
    name: "Queso parmesano",
    category: "quesos",
    saleUnit: "kg",
    price: 480,
    presentation: "Venta por kilo",
    description:
      "Maduración larga, sabor intenso y salino. Para rallar o comer en lascas.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-provolone",
    name: "Queso provolone",
    category: "quesos",
    saleUnit: "kg",
    price: 420,
    presentation: "Venta por kilo",
    description: "Carácter fuerte y aroma marcado. El del disco y la parrilla.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-rallado",
    name: "Queso rallado",
    category: "quesos",
    saleUnit: "kg",
    price: 350,
    presentation: "Venta por kilo",
    description: "Rallado fresco, listo para pastas, salsas y gratinados.",
    weightOptions: WEIGHT_OPTIONS,
  },
  {
    slug: "queso-untable",
    name: "Queso untable",
    category: "quesos",
    saleUnit: "unit",
    price: 115,
    presentation: "Envase de 385 g",
    description: "Cremoso y fresco, para el pan de la mañana o una picada.",
  },

  // ── Mermeladas y dulces ───────────────────────────────────────────────────
  {
    slug: "mermelada-frutilla",
    name: "Mermelada de frutilla",
    category: "dulces",
    saleUnit: "unit",
    price: 120,
    presentation: "Frasco de 380 g",
    description: "Fruta y azúcar, nada más. Dulzor parejo y color intenso.",
  },
  {
    slug: "mermelada-higo",
    name: "Mermelada de higo",
    category: "dulces",
    saleUnit: "unit",
    price: 120,
    presentation: "Frasco de 380 g",
    description: "Compañera perfecta de un queso de carácter.",
  },
  {
    slug: "mermelada-durazno",
    name: "Mermelada de durazno",
    category: "dulces",
    saleUnit: "unit",
    price: 120,
    presentation: "Frasco de 380 g",
    description: "Suave y aromática, con trozos de fruta.",
  },
  {
    slug: "dulce-membrillo",
    name: "Dulce de membrillo",
    category: "dulces",
    saleUnit: "unit",
    price: 120,
    presentation: "Envase de 1 kg",
    description: "Firme y de corte prolijo. Queso y dulce, como siempre.",
  },
  {
    slug: "dulce-de-leche",
    name: "Dulce de leche",
    category: "dulces",
    saleUnit: "unit",
    price: 150,
    presentation: "Envase de 1 kg",
    description: "Cocción lenta, textura espesa y sabor de campo.",
  },

  // ── Otros ─────────────────────────────────────────────────────────────────
  {
    slug: "pizza-cuatro-quesos",
    name: "Pizza cuatro quesos",
    category: "otros",
    saleUnit: "unit",
    price: 250,
    presentation: "1 unidad",
    description: "Lista para el horno, con nuestra propia mezcla de quesos.",
  },
  {
    slug: "chorizo-chacarero",
    name: "Chorizo chacarero",
    category: "otros",
    saleUnit: "kg",
    price: 690,
    presentation: "Venta por kilo",
    description: "Elaboración artesanal, condimento justo. Para la parrilla.",
    weightOptions: WEIGHT_OPTIONS,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
