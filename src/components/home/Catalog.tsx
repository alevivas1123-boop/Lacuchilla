"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { CATEGORIES } from "@/lib/categorias";
import { cn } from "@/lib/cn";
import type { Producto, ProductCategory } from "@/lib/types";

type Filter = ProductCategory | "todos";

export function Catalog({ products }: { products: Producto[] }) {
  const [filter, setFilter] = useState<Filter>("todos");

  const visible = useMemo(
    () => (filter === "todos" ? products : products.filter((p) => p.category === filter)),
    [products, filter],
  );

  return (
    <section id="productos" className="scroll-mt-24 bg-cream py-14 sm:py-20">
      <div className="container-page">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-olive uppercase">
            Nuestro catálogo
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Elegí lo que te llevás
          </h2>
          <p className="mt-3 text-base text-bark">
            Precios en pesos uruguayos. Los quesos y el chorizo se venden por kilo; los dulces,
            mermeladas y la pizza, por unidad.
          </p>
        </header>

        <div
          role="group"
          aria-label="Filtrar productos por categoría"
          className="mt-7 -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {CATEGORIES.map((category) => {
            const active = filter === category.id;
            const count =
              category.id === "todos"
                ? products.length
                : products.filter((p) => p.category === category.id).length;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setFilter(category.id)}
                aria-pressed={active}
                className={cn(
                  "min-h-11 shrink-0 snap-start rounded-full border-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  active
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/15 bg-card text-ink hover:border-ink/45 hover:bg-cream-deep/50",
                )}
              >
                {category.label}
                <span className={cn("ml-2 text-xs font-medium", active ? "text-cream/70" : "text-bark/70")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="sr-only">
          {visible.length} productos visibles
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product, index) => (
            <ProductCard key={product.slug} product={product} priority={index < 2} />
          ))}
        </div>
      </div>
    </section>
  );
}
