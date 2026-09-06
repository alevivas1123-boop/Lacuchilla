"use client";

import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/ui/Logo";
import { cartCount, useCartStore } from "@/lib/cart-store";
import { useCartUI } from "@/lib/cart-ui-store";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/#productos", label: "Productos" },
  { href: "/#como-comprar", label: "Cómo comprar" },
  { href: "/#contacto", label: "Contacto" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const openCart = useCartUI((state) => state.openCart);
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const count = hydrated ? cartCount(items) : 0;

  // Cierra el menú al pasar a escritorio para no dejarlo abierto de fondo.
  useEffect(() => {
    if (!menuOpen) return;
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => media.matches && setMenuOpen(false);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/92 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
        <Logo size={40} withTagline />

        <nav aria-label="Navegación principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-full px-4 text-[0.95rem] font-medium text-ink transition-colors hover:bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openCart}
            className="relative flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            aria-label={
              count === 0
                ? "Abrir carrito, está vacío"
                : `Abrir carrito, ${count} ${count === 1 ? "producto" : "productos"}`
            }
          >
            <ShoppingBag aria-hidden="true" className="size-5.5" />
            {count > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-cheese px-1.5 py-0.5 text-[0.7rem] font-bold text-ink tabular-nums"
              >
                {count}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5.5" />
            ) : (
              <Menu aria-hidden="true" className="size-5.5" />
            )}
          </button>
        </div>
      </div>

      <nav
        id="menu-mobile"
        aria-label="Navegación principal (móvil)"
        className={cn("overflow-hidden border-t border-ink/10 md:hidden", menuOpen ? "block" : "hidden")}
      >
        <ul className="container-page flex flex-col py-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center rounded-lg px-2 text-base font-medium text-ink transition-colors hover:bg-ink/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
