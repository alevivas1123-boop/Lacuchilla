"use server";

import { listarProductosPublicos } from "@/db/queries";
import { ajustarCantidad, type CartItem } from "@/lib/types";

/**
 * Revalida el carrito contra el catálogo vigente antes de confirmar el pedido.
 *
 * Lo guardado en el navegador es una foto del momento en que se agregó el
 * producto: el precio pudo cambiar, el producto pudo darse de baja o su rango
 * de cantidades pudo achicarse. Acá manda la base, nunca el cliente.
 */
export interface CarritoRevalidado {
  ok: boolean;
  items: CartItem[];
  total: number;
  /** Qué cambió, para poder avisárselo a la persona antes de confirmar. */
  avisos: string[];
  /** true si no se pudo consultar la base: no se debe confirmar el pedido. */
  sinConexion?: boolean;
}

export async function revalidarCarrito(items: CartItem[]): Promise<CarritoRevalidado> {
  let vigentes;
  try {
    vigentes = await listarProductosPublicos();
  } catch {
    return {
      ok: false,
      items,
      total: 0,
      avisos: [],
      sinConexion: true,
    };
  }

  const porSlug = new Map(vigentes.map((producto) => [producto.slug, producto]));
  const avisos: string[] = [];
  const revalidados: CartItem[] = [];

  for (const item of items) {
    const producto = porSlug.get(item.slug);

    if (!producto) {
      avisos.push(`${item.name} ya no está disponible y se quitó del pedido.`);
      continue;
    }

    const cantidad = ajustarCantidad(item.quantity, producto);
    if (cantidad !== item.quantity) {
      avisos.push(
        `La cantidad de ${producto.name} se ajustó a ${cantidad} ${producto.unitLabel}.`,
      );
    }
    if (producto.price !== item.unitPrice) {
      avisos.push(`El precio de ${producto.name} cambió y se actualizó en tu pedido.`);
    }

    revalidados.push({
      id: producto.slug,
      slug: producto.slug,
      name: producto.name,
      category: producto.category,
      saleType: producto.saleType,
      unitLabel: producto.unitLabel,
      presentation: producto.presentation,
      unitPrice: producto.price,
      quantity: cantidad,
      minQuantity: producto.minQuantity,
      maxQuantity: producto.maxQuantity,
      quantityStep: producto.quantityStep,
      imageUrl: producto.imageUrl,
    });
  }

  return {
    ok: revalidados.length > 0,
    items: revalidados,
    total: revalidados.reduce((suma, item) => suma + item.unitPrice * item.quantity, 0),
    avisos,
  };
}
