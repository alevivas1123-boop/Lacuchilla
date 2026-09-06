import Link from "next/link";
import { ShoppingBasket } from "lucide-react";

import { buttonStyles } from "@/components/ui/button-styles";

export function EmptyCart({ onContinue }: { onContinue?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-cream-deep text-bark">
        <ShoppingBasket aria-hidden="true" className="size-7" />
      </span>
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-ink">
          Tu carrito está esperando algo rico.
        </p>
        <p className="text-sm text-bark">
          Recorré el catálogo y armá tu pedido: quesos por kilo, dulces y mermeladas.
        </p>
      </div>
      <Link href="/#productos" onClick={onContinue} className={buttonStyles("primary", "md")}>
        Ver productos
      </Link>
    </div>
  );
}
