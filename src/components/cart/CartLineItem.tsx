"use client";

import { Trash2 } from "lucide-react";

import { ProductImage } from "@/components/product/ProductImage";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { lineTotal, useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { formatPrice, formatQuantity, unitLabelText } from "@/lib/format";
import type { CartItem } from "@/lib/types";

interface CartLineItemProps {
  item: CartItem;
  /** "drawer" es la versión compacta del carrito lateral. */
  variant?: "drawer" | "page";
}

export function CartLineItem({ item, variant = "drawer" }: CartLineItemProps) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const isPage = variant === "page";

  return (
    <li
      className={cn(
        "flex gap-3 py-4",
        isPage ? "sm:gap-5 sm:py-6" : "",
      )}
    >
      <div className={cn("shrink-0 overflow-hidden rounded-xl", isPage ? "w-24 sm:w-32" : "w-20")}>
        <ProductImage
          src={item.imageUrl ?? undefined}
          alt={item.name}
          name={item.name}
          category={item.category}
          aspectClassName="aspect-square"
          compact
          sizes="128px"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              className={cn(
                "font-display font-semibold text-ink",
                isPage ? "text-base sm:text-lg" : "text-[0.95rem] leading-tight",
              )}
            >
              {item.name}
            </h3>
            <p className="mt-0.5 text-sm text-bark">
              {item.saleType === "weight"
                ? formatQuantity(item.quantity, item.unitLabel)
                : item.presentation}
            </p>
            <p className="text-sm text-bark/80">
              {formatPrice(item.unitPriceCents)} {unitLabelText(item.unitLabel)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.id)}
            aria-label={`Eliminar ${item.name} del carrito`}
            className="-m-1 flex size-11 shrink-0 items-center justify-center rounded-full text-bark transition-colors hover:bg-ink/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <QuantityStepper
            value={item.quantity}
            onChange={(value) => setQuantity(item.id, value)}
            min={item.minQuantity ?? 1}
            max={item.maxQuantity ?? 99}
            step={item.quantityStep ?? 1}
            size={isPage ? "md" : "sm"}
            label={
              item.saleType === "weight"
                ? `${item.unitLabel} de ${item.name}`
                : `Unidades de ${item.name}`
            }
          />
          <p className={cn("font-display font-semibold text-ink tabular-nums", isPage ? "text-lg" : "text-base")}>
            {formatPrice(lineTotal(item))}
          </p>
        </div>
      </div>
    </li>
  );
}
