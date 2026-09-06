import type { ProductRow } from "@/db/schema";

export type ProductCategory = ProductRow["category"];
export type SaleType = ProductRow["saleType"];

/** Producto tal como lo consume la tienda pública. Sin datos administrativos. */
export type Producto = Omit<
  ProductRow,
  "createdAt" | "updatedAt" | "imageBlobPath" | "description"
> & {
  description: string | null;
};

/** Producto completo, para el panel de administración. */
export type ProductoAdmin = ProductRow;

export interface CartItem {
  /** Clave de la línea del carrito: el slug del producto. */
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  saleType: SaleType;
  unitLabel: string;
  presentation: string;
  /** Precio por kilo o por unidad, en centésimos. */
  unitPriceCents: number;
  /** Kilos (saleType "weight") o unidades (saleType "unit"). */
  quantity: number;
  /**
   * Configuración de cantidades vigente al agregar el producto. Viaja con la
   * línea para que el selector funcione sin volver a consultar la base, y se
   * revalida contra el producto actual antes de confirmar el pedido.
   */
  minQuantity?: number;
  maxQuantity?: number;
  quantityStep?: number;
  /** Foto vigente al agregar el producto, para la miniatura del carrito. */
  imageUrl?: string | null;
}

export interface OrderCustomer {
  fullName: string;
  phone: string;
  email?: string;
  fulfillment: "envio" | "retiro";
  address?: string;
  locality?: string;
  preferredTime?: string;
  notes?: string;
}

export interface Order {
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  /** Total en centésimos. */
  totalCents: number;
  customer: OrderCustomer;
}

/** Convierte una fila de la base en el producto que consume la tienda. */
export function aProductoPublico(fila: ProductRow): Producto {
  return {
    id: fila.id,
    slug: fila.slug,
    name: fila.name,
    description: fila.description,
    category: fila.category,
    priceCents: fila.priceCents,
    currency: fila.currency,
    saleType: fila.saleType,
    unitLabel: fila.unitLabel,
    minQuantity: fila.minQuantity,
    maxQuantity: fila.maxQuantity,
    quantityStep: fila.quantityStep,
    presentation: fila.presentation,
    imageUrl: fila.imageUrl,
    imageAlt: fila.imageAlt,
    active: fila.active,
    sortOrder: fila.sortOrder,
  };
}

/** Opciones del selector de cantidad, derivadas de la configuración del producto. */
export function opcionesDeCantidad(producto: {
  minQuantity: number;
  maxQuantity: number;
  quantityStep: number;
}): number[] {
  const { minQuantity, maxQuantity, quantityStep } = producto;
  if (quantityStep <= 0 || maxQuantity < minQuantity) return [minQuantity];
  const opciones: number[] = [];
  // Tope defensivo: una configuración rara no puede generar una lista infinita.
  for (let valor = minQuantity; valor <= maxQuantity && opciones.length < 100; valor += quantityStep) {
    opciones.push(valor);
  }
  return opciones.length > 0 ? opciones : [minQuantity];
}

/** Ajusta una cantidad al rango y al incremento del producto. */
export function ajustarCantidad(
  cantidad: number,
  producto: { minQuantity: number; maxQuantity: number; quantityStep: number },
): number {
  const { minQuantity, maxQuantity, quantityStep } = producto;
  if (!Number.isFinite(cantidad)) return minQuantity;
  const acotada = Math.min(maxQuantity, Math.max(minQuantity, Math.round(cantidad)));
  if (quantityStep <= 1) return acotada;
  const pasos = Math.round((acotada - minQuantity) / quantityStep);
  return Math.min(maxQuantity, minQuantity + pasos * quantityStep);
}
