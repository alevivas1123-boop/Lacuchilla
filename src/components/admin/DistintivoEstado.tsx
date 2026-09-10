import type { OrderStatus } from "@/db/schema";
import { COLOR_ESTADO, ETIQUETA_ESTADO } from "@/lib/estados-pedido";
import { cn } from "@/lib/cn";

export function DistintivoEstado({
  estado,
  className,
}: {
  estado: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        COLOR_ESTADO[estado],
        className,
      )}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
