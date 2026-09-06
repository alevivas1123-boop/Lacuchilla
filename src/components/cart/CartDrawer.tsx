"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { CartLineItem } from "@/components/cart/CartLineItem";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { buttonStyles } from "@/components/ui/button-styles";
import { cartTotal, useCartStore } from "@/lib/cart-store";
import { useCartUI } from "@/lib/cart-ui-store";
import { formatPrice } from "@/lib/format";

export function CartDrawer({ availableImages }: { availableImages: string[] }) {
  const isOpen = useCartUI((state) => state.isOpen);
  const closeCart = useCartUI((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCart();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, closeCart]);

  // Al navegar a otra página el carrito lateral se cierra solo.
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  const total = cartTotal(items);

  return (
    <div
      className={isOpen ? "fixed inset-0 z-[60]" : "pointer-events-none fixed inset-0 z-[60]"}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Cerrar carrito"
        onClick={closeCart}
        className={`absolute inset-0 bg-ink/45 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal={isOpen}
        aria-label="Carrito de compras"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-lifted transition-transform duration-250 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-ink">Tu pedido</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            tabIndex={isOpen ? 0 : -1}
            aria-label="Cerrar carrito"
            className="-mr-2 flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyCart onContinue={closeCart} />
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} availableImages={availableImages} />
              ))}
            </ul>

            <footer className="space-y-3 border-t border-ink/10 bg-card px-5 py-4">
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-bark">Total del pedido</span>
                <span className="font-display text-2xl font-semibold text-ink tabular-nums">
                  {formatPrice(total)}
                </span>
              </p>
              <p className="text-xs text-bark">
                Coordinamos el pago y la entrega después de confirmar el pedido.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href="/carrito"
                  tabIndex={isOpen ? 0 : -1}
                  className={buttonStyles("outline", "md", "w-full")}
                >
                  Ver carrito
                </Link>
                <Link
                  href="/checkout"
                  tabIndex={isOpen ? 0 : -1}
                  className={buttonStyles("primary", "md", "w-full")}
                >
                  Continuar con el pedido
                </Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
