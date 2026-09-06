"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { CartItem, Product } from "@/lib/types";

/** Tope por línea para evitar pedidos accidentales de 999 kg. */
export const MAX_QUANTITY = 20;

interface CartState {
  items: CartItem[];
  /** true cuando zustand terminó de leer localStorage (evita mismatch de hidratación). */
  hydrated: boolean;
  setHydrated: () => void;
  addItem: (product: Product, quantity: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

function toCartItem(product: Product, quantity: number): CartItem {
  return {
    id: product.slug,
    slug: product.slug,
    name: product.name,
    category: product.category,
    saleUnit: product.saleUnit,
    presentation: product.presentation,
    unitPrice: product.price,
    quantity,
  };
}

const clamp = (value: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.round(value)));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      addItem: (product, quantity) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === product.slug);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.slug
                  ? { ...item, quantity: clamp(item.quantity + quantity) }
                  : item,
              ),
            };
          }
          return { items: [...state.items, toCartItem(product, clamp(quantity))] };
        }),

      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: clamp(quantity) } : item,
          ),
        })),

      increment: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: clamp(item.quantity + 1) } : item,
          ),
        })),

      decrement: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: clamp(item.quantity - 1) } : item,
          ),
        })),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "la-cuchilla:cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Solo se persisten las líneas; `hydrated` es estado de runtime.
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Subtotal de una línea: precio por kilo/unidad × cantidad. */
export function lineTotal(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + lineTotal(item), 0);
}

/** Cantidad de líneas distintas en el carrito (lo que muestra el badge). */
export function cartCount(items: CartItem[]): number {
  return items.length;
}
