"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { ajustarCantidad, type CartItem, type Producto } from "@/lib/types";

interface CartState {
  items: CartItem[];
  /** true cuando zustand terminó de leer localStorage (evita mismatch de hidratación). */
  hydrated: boolean;
  setHydrated: () => void;
  addItem: (product: Producto, quantity: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  /** Reemplaza el carrito por una versión revalidada contra la base. */
  replaceAll: (items: CartItem[]) => void;
}

function aLineaDeCarrito(product: Producto, quantity: number): CartItem {
  return {
    id: product.slug,
    slug: product.slug,
    name: product.name,
    category: product.category,
    saleType: product.saleType,
    unitLabel: product.unitLabel,
    presentation: product.presentation,
    unitPriceCents: product.priceCents,
    quantity: ajustarCantidad(quantity, product),
    minQuantity: product.minQuantity,
    maxQuantity: product.maxQuantity,
    quantityStep: product.quantityStep,
    imageUrl: product.imageUrl,
  };
}

/**
 * La cantidad de cada línea se ajusta al rango del producto, no a un tope
 * global: un queso va de 1 a 5 kg y un frasco puede llegar a 20 unidades.
 * La configuración viaja en la línea y se vuelve a validar contra la base
 * antes de confirmar el pedido.
 */
function limitesDeLinea(item: CartItem) {
  return {
    minQuantity: item.minQuantity ?? 1,
    maxQuantity: item.maxQuantity ?? 99,
    quantityStep: item.quantityStep ?? 1,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      addItem: (product, quantity) =>
        set((state) => {
          const existente = state.items.find((item) => item.id === product.slug);
          if (existente) {
            return {
              items: state.items.map((item) =>
                item.id === product.slug
                  ? { ...item, quantity: ajustarCantidad(item.quantity + quantity, product) }
                  : item,
              ),
            };
          }
          return { items: [...state.items, aLineaDeCarrito(product, quantity)] };
        }),

      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: ajustarCantidad(quantity, limitesDeLinea(item)) } : item,
          ),
        })),

      increment: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: ajustarCantidad(
                    item.quantity + (item.quantityStep ?? 1),
                    limitesDeLinea(item),
                  ),
                }
              : item,
          ),
        })),

      decrement: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: ajustarCantidad(
                    item.quantity - (item.quantityStep ?? 1),
                    limitesDeLinea(item),
                  ),
                }
              : item,
          ),
        })),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      clear: () => set({ items: [] }),

      replaceAll: (items) => set({ items }),
    }),
    {
      name: "la-cuchilla:cart",
      // v2: los precios pasaron de pesos a centésimos y las líneas guardan su
      // propia configuración de cantidades.
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      migrate: (estado, versionPrevia) => {
        const guardado = estado as { items?: unknown[] } | undefined;
        if (!guardado?.items) return { items: [] };
        if (versionPrevia >= 2) return guardado as { items: CartItem[] };
        // Un carrito viejo tiene precios en pesos y no conoce los límites.
        // Se descarta: reconstruirlo mal sería peor que pedirle al cliente que
        // vuelva a elegir, y los datos correctos están a un clic.
        return { items: [] };
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Subtotal de una línea, en centésimos. */
export function lineTotal(item: CartItem): number {
  return item.unitPriceCents * item.quantity;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + lineTotal(item), 0);
}

/** Cantidad de líneas distintas en el carrito (lo que muestra el badge). */
export function cartCount(items: CartItem[]): number {
  return items.length;
}
