import Image from "next/image";

import { cn } from "@/lib/cn";
import type { ProductCategory } from "@/lib/types";

interface ProductImageProps {
  /** Ruta de la foto dentro de /public. Si falta, se dibuja el placeholder. */
  src?: string;
  /** Texto alternativo descriptivo. */
  alt?: string;
  /** Nombre del producto (para el placeholder y como alt de respaldo). */
  name: string;
  category: ProductCategory;
  /** Cómo encaja la foto en el recuadro. */
  fit?: "cover" | "contain";
  /** Ancho estimado de render, para que Next elija bien la imagen. */
  sizes?: string;
  priority?: boolean;
  /** Relación de aspecto del recuadro. Por defecto 4:3, como las fotos. */
  aspectClassName?: string;
  /** Miniatura: dibuja solo el ícono, sin el nombre (para el carrito). */
  compact?: boolean;
  className?: string;
}

/** Tono del placeholder según la familia de producto. */
const placeholderTone: Record<ProductCategory, { from: string; to: string; accent: string }> = {
  quesos: { from: "#F6E3B8", to: "#E7C77A", accent: "#C08D2E" },
  dulces: { from: "#F1DFCB", to: "#DCC0A2", accent: "#A9683F" },
  otros: { from: "#E4E4D2", to: "#CBCBB0", accent: "#727252" },
};

/**
 * Foto del producto dentro de un recuadro de proporción fija.
 *
 * La foto nunca se deforma: el recuadro mantiene la relación 4:3 y la imagen
 * se ajusta con object-fit sobre un fondo crema. Si el producto todavía no
 * tiene foto se dibuja un placeholder de marca, así no hay imágenes rotas ni
 * peticiones 404.
 */
export function ProductImage({
  src,
  alt,
  name,
  category,
  fit = "cover",
  sizes = "(min-width: 1280px) 300px, (min-width: 1024px) 30vw, (min-width: 380px) 46vw, 92vw",
  priority = false,
  aspectClassName = "aspect-[4/3]",
  compact = false,
  className,
}: ProductImageProps) {
  const wrapper = cn("relative w-full overflow-hidden bg-cream", aspectClassName, className);

  if (src) {
    return (
      <div className={wrapper}>
        <Image
          src={src}
          alt={alt ?? name}
          fill
          sizes={sizes}
          priority={priority}
          className={fit === "contain" ? "object-contain" : "object-cover"}
        />
      </div>
    );
  }

  const tone = placeholderTone[category];
  const patternId = `patron-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className={wrapper}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(140deg, ${tone.from} 0%, ${tone.to} 100%)` }}
      />
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full opacity-25"
        viewBox="0 0 120 90"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={patternId} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="1.4" fill={tone.accent} />
          </pattern>
        </defs>
        <rect width="120" height="90" fill={`url(#${patternId})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center sm:gap-2 sm:p-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 48 40"
          className={compact ? "h-7 w-9 shrink-0" : "h-7 w-9 shrink-0 sm:h-8 sm:w-10"}
        >
          <path
            d="M4 34h40L24 6z"
            fill="none"
            stroke={tone.accent}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="26" r="3.2" fill="none" stroke={tone.accent} strokeWidth="2.4" />
          <circle cx="30" cy="29" r="2.2" fill="none" stroke={tone.accent} strokeWidth="2.4" />
        </svg>
        {compact ? null : (
          <>
            <span className="line-clamp-2 font-display text-xs leading-snug font-semibold text-ink/75 sm:text-sm">
              {name}
            </span>
            <span className="hidden text-xs font-medium tracking-[0.14em] text-ink/45 uppercase sm:block">
              Foto en camino
            </span>
          </>
        )}
      </div>
    </div>
  );
}
