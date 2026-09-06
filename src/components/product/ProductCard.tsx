"use client";

import { ShoppingBasket } from "lucide-react";
import { useState } from "react";

import { ProductImage } from "@/components/product/ProductImage";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { WeightSelector } from "@/components/product/WeightSelector";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { WEIGHT_OPTIONS } from "@/data/products";
import { MAX_QUANTITY, useCartStore } from "@/lib/cart-store";
import { formatPrice, formatQuantity, unitLabel } from "@/lib/format";
import type { Product } from "@/lib/types";

const categoryLabel: Record<Product["category"], string> = {
  quesos: "Quesos",
  dulces: "Mermeladas y dulces",
  otros: "Otros",
};

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const isByWeight = product.saleUnit === "kg";
  const options = product.weightOptions ?? WEIGHT_OPTIONS;

  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  const total = product.price * quantity;

  function handleAdd() {
    addItem(product, quantity);
    showToast(`${product.name} · ${formatQuantity(quantity, product.saleUnit)} en el carrito`);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-ink/10 bg-card shadow-soft transition-shadow duration-200 hover:shadow-lifted">
      <ProductImage
        src={product.hasImage ? product.image : undefined}
        alt={product.alt}
        name={product.name}
        category={product.category}
        fit={product.imageFit}
        priority={priority}
      />

      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:gap-3 sm:p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">
            {categoryLabel[product.category]}
          </p>
          <h3 className="font-display text-base leading-tight font-semibold text-ink sm:text-lg">
            {product.name}
          </h3>
          <p className="text-sm text-bark">{product.presentation}</p>
        </div>

        <p className="line-clamp-2 text-sm text-bark/90 sm:line-clamp-none">
          {product.description}
        </p>

        <p className="mt-auto pt-1">
          <span className="font-display text-xl font-semibold text-ink sm:text-2xl">
            {formatPrice(product.price)}
          </span>{" "}
          <span className="text-sm font-medium text-bark">{unitLabel(product.saleUnit)}</span>
        </p>

        <div className="space-y-3 border-t border-ink/10 pt-3">
          {isByWeight ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-bark">
                Peso:{" "}
                <span className="font-semibold text-ink">{formatQuantity(quantity, "kg")}</span>
              </p>

              {/* En pantallas angostas, un desplegable nativo entra mejor que
                  cinco pastillas; desde sm se muestra el control segmentado. */}
              <select
                id={`peso-${product.slug}`}
                aria-label={`Peso — ${product.name}`}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="min-h-11 w-full rounded-lg border-2 border-ink/15 bg-cream px-3 text-base font-semibold text-ink hover:border-ink/40 focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink sm:hidden"
              >
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option} kg
                  </option>
                ))}
              </select>

              <div className="hidden sm:block">
                <WeightSelector
                  options={options}
                  value={quantity}
                  onChange={setQuantity}
                  productName={product.name}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-sm font-medium text-bark">Cantidad</p>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={MAX_QUANTITY}
                label={`Cantidad de ${product.name}`}
                className="self-start sm:self-auto"
              />
            </div>
          )}

          <p className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-bark">Total</span>
            <span
              aria-live="polite"
              className="font-display text-lg font-semibold text-ink tabular-nums sm:text-xl"
            >
              {formatPrice(total)}
            </span>
          </p>

          <Button
            variant={justAdded ? "secondary" : "primary"}
            size="card"
            className="w-full"
            onClick={handleAdd}
          >
            <ShoppingBasket aria-hidden="true" className="hidden size-4.5 shrink-0 sm:block" />
            {justAdded ? "¡Agregado!" : "Agregar al carrito"}
          </Button>
        </div>
      </div>
    </article>
  );
}
