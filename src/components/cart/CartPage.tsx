"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { buttonStyles } from "@/components/ui/button-styles";
import { siteConfig } from "@/config/site";
import { cartTotal, useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const total = cartTotal(items);

  return (
    <div className="container-page py-10 sm:py-14">
      <Link
        href="/#productos"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-bark transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Seguir comprando
      </Link>

      <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">Tu carrito</h1>

      {!hydrated ? (
        <div className="mt-8 max-w-2xl">
          <CartSkeleton />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-card border border-ink/10 bg-card">
          <EmptyCart />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <section aria-label="Productos del pedido" className="rounded-card border border-ink/10 bg-card px-4 sm:px-6">
            <ul className="divide-y divide-ink/10">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} variant="page" />
              ))}
            </ul>
          </section>

          <aside className="rounded-card border border-ink/10 bg-card p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold text-ink">Resumen</h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-bark">
                  {items.length} {items.length === 1 ? "producto" : "productos"}
                </dt>
                <dd className="font-medium text-ink tabular-nums">{formatPrice(total)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-bark">Envío</dt>
                <dd className="text-right text-ink/80">A coordinar</dd>
              </div>
            </dl>

            <p className="mt-4 flex items-baseline justify-between gap-3 border-t border-ink/10 pt-4">
              <span className="font-medium text-bark">Total</span>
              <span className="font-display text-2xl font-semibold text-ink tabular-nums">
                {formatPrice(total)}
              </span>
            </p>

            <Link href="/checkout" className={buttonStyles("primary", "lg", "mt-5 w-full")}>
              Continuar con el pedido
            </Link>
            <Link href="/#productos" className={buttonStyles("ghost", "md", "mt-2 w-full")}>
              Seguir comprando
            </Link>

            <p className="mt-4 text-xs leading-relaxed text-bark">{siteConfig.paymentNotice}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
