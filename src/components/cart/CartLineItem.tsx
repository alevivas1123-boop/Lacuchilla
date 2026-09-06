"use client";

import { Trash2 } from "lucide-react";

import { ProductImage } from "@/components/product/ProductImage";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { MAX_QUANTITY, lineTotal, useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/cn";
import { formatPrice, formatQuantity, unitLabel } from "@/lib/format";
import type { CartItem } from "@/lib/types";

interface CartLineItemProps {
  item: CartItem;
  /** Slugs con foto real disponible. */
  availableImages: string[];
  /** "drawer" es la versión compacta del carrito lateral. */
  variant?: "drawer" | "page";
}

export function CartLineItem({ item, availableImages, variant = "drawer" }: CartLineItemProps) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const isPage = variant === "page";
  const hasImage = availableImages.includes(item.slug);

  return (
    <li
      className={cn(
        "flex gap-3 py-4",
        isPage ? "sm:gap-5 sm:py-6" : "",
      )}
    >
      <div className={cn("shrink-0 overflow-hidden rounded-xl", isPage ? "w-24 sm:w-32" : "w-20")}>
        <ProductImage
          slug={item.slug}
          name={item.name}
          category={item.category}
          hasImage={hasImage}
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
              {item.saleUnit === "kg" ? formatQuantity(item.quantity, "kg") : item.presentation}
            </p>
            <p className="text-sm text-bark/80">
              {formatPrice(item.unitPrice)} {unitLabel(item.saleUnit)}
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
            max={MAX_QUANTITY}
            size={isPage ? "md" : "sm"}
            label={
              item.saleUnit === "kg"
                ? `Kilos de ${item.name}`
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
