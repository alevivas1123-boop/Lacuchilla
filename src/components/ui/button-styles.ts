import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "card";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-colors duration-150 select-none " +
  "disabled:cursor-not-allowed disabled:opacity-45 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-cream hover:bg-bark active:bg-ink",
  secondary: "bg-cheese text-ink hover:bg-cheese-deep active:bg-cheese-deep",
  outline:
    "border-2 border-ink/25 bg-card text-ink hover:border-ink/60 hover:bg-cream active:bg-cream-deep",
  ghost: "text-ink hover:bg-ink/8 active:bg-ink/12",
};

/** Alturas cómodas para el pulgar: mínimo 44px en los tamaños md y lg. */
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-11 px-5 text-[0.95rem]",
  lg: "min-h-13 px-7 text-base",
  // Botón de la tarjeta de producto: entra en dos columnas de celular y
  // crece a partir de sm. Va en una sola entrada del mapa para que Tailwind
  // no tenga que resolver clases de padding en conflicto.
  card: "min-h-11 px-2 text-[0.8rem] sm:min-h-13 sm:px-5 sm:text-base",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}
