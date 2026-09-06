"use client";

import { ShoppingBasket } from "lucide-react";
import { useState } from "react";

import { DistintivoProvisoria } from "@/components/dev/DistintivoProvisoria";
import { ProductImage } from "@/components/product/ProductImage";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { WeightSelector } from "@/components/product/WeightSelector";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { useCartStore } from "@/lib/cart-store";
import { NOMBRE_CATEGORIA } from "@/lib/categorias";
import { formatPrice, formatQuantity, unitLabelText } from "@/lib/format";
import { ajustarCantidad, opcionesDeCantidad, type Producto } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Producto & { esProvisoria?: boolean };
  priority?: boolean;
}) {
  const esPorPeso = product.saleType === "weight";
  // Las opciones salen de la configuración del producto, no de una lista fija.
  const opciones = opcionesDeCantidad(product);
  const usaSelector = esPorPeso && opciones.length > 1 && opciones.length <= 8;

  const [quantity, setQuantity] = useState(product.minQuantity);
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  const total = product.priceCents * quantity;

  function handleAdd() {
    addItem(product, quantity);
    showToast(`${product.name} · ${formatQuantity(quantity, product.unitLabel)} en el carrito`);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-ink/10 bg-card shadow-soft transition-shadow duration-200 hover:shadow-lifted">
      <div className="relative">
        <DistintivoProvisoria provisoria={product.esProvisoria} />
        <ProductImage
          src={product.imageUrl ?? undefined}
          alt={product.imageAlt ?? product.name}
          name={product.name}
          category={product.category}
          priority={priority}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:gap-3 sm:p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">
            {NOMBRE_CATEGORIA[product.category]}
          </p>
          <h3 className="font-display text-base leading-tight font-semibold text-ink sm:text-lg">
            {product.name}
          </h3>
          <p className="text-sm text-bark">{product.presentation}</p>
        </div>

        {product.description ? (
          <p className="line-clamp-2 text-sm text-bark/90 sm:line-clamp-none">
            {product.description}
          </p>
        ) : null}

        <p className="mt-auto pt-1">
          <span className="font-display text-xl font-semibold text-ink sm:text-2xl">
            {formatPrice(product.priceCents)}
          </span>{" "}
          <span className="text-sm font-medium text-bark">{unitLabelText(product.unitLabel)}</span>
        </p>

        <div className="space-y-3 border-t border-ink/10 pt-3">
          {usaSelector ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-bark">
                Peso:{" "}
                <span className="font-semibold text-ink">
                  {formatQuantity(quantity, product.unitLabel)}
                </span>
              </p>

              {/* En pantallas angostas, un desplegable nativo entra mejor que
                  las pastillas; desde sm se muestra el control segmentado. */}
              <select
                id={`cantidad-${product.slug}`}
                aria-label={`Peso — ${product.name}`}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="min-h-11 w-full rounded-lg border-2 border-ink/15 bg-cream px-3 text-base font-semibold text-ink hover:border-ink/40 focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink sm:hidden"
              >
                {opciones.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion} {product.unitLabel}
                  </option>
                ))}
              </select>

              <div className="hidden sm:block">
                <WeightSelector
                  options={opciones}
                  value={quantity}
                  onChange={setQuantity}
                  productName={product.name}
                  unitLabel={product.unitLabel}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-sm font-medium text-bark">Cantidad</p>
              <QuantityStepper
                value={quantity}
                onChange={(valor) => setQuantity(ajustarCantidad(valor, product))}
                min={product.minQuantity}
                max={product.maxQuantity}
                step={product.quantityStep}
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
