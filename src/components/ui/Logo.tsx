import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Poné `true` si el logo oficial que dejaste en /public/logo.svg ya incluye
 * el nombre "La Cuchilla" dibujado: así no se repite el texto al lado.
 */
const LOGO_INCLUDES_WORDMARK = false;

interface LogoProps {
  /** Tamaño del isotipo en píxeles. */
  size?: number;
  /** Muestra el nombre y la bajada junto al isotipo. */
  withWordmark?: boolean;
  /** Muestra "Quesos con carácter" bajo el nombre. */
  withTagline?: boolean;
  className?: string;
  /** Si es true, envuelve todo en un enlace a la home. */
  asLink?: boolean;
}

export function Logo({
  size = 44,
  withWordmark = true,
  withTagline = false,
  className,
  asLink = true,
}: LogoProps) {
  const showWordmark = withWordmark && !LOGO_INCLUDES_WORDMARK;

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.svg"
        alt={showWordmark ? "" : siteConfig.name}
        aria-hidden={showWordmark || undefined}
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
            {siteConfig.name}
          </span>
          {withTagline ? (
            <span className="mt-1 text-[0.7rem] font-medium tracking-[0.18em] text-bark uppercase">
              {siteConfig.tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (!asLink) return content;

  return (
    <Link
      href="/"
      className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      aria-label={`${siteConfig.name} — ir al inicio`}
    >
      {content}
    </Link>
  );
}
