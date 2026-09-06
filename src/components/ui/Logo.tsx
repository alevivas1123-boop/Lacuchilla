import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * La insignia oficial ya trae dibujado "Quesería La Cuchilla · Quesos con
 * carácter", pero a 44 px ese texto no se lee: en el header y el footer el
 * sello acompaña a un nombre en tipografía, que es el que hace el trabajo.
 * Poné `true` si preferís mostrar únicamente la insignia, sin texto al lado.
 */
const LOGO_INCLUDES_WORDMARK = false;

interface LogoProps {
  /** Tamaño de la insignia en píxeles. */
  size?: number;
  /** Muestra el nombre y la bajada junto a la insignia. */
  withWordmark?: boolean;
  /** Muestra "Quesos con carácter" bajo el nombre. */
  withTagline?: boolean;
  /** Clases extra para la bajada (por ejemplo, ocultarla en pantallas muy angostas). */
  taglineClassName?: string;
  /** Pinta la insignia de un color plano (para fondos oscuros). */
  tone?: "ink" | "cream";
  className?: string;
  /** Si es true, envuelve todo en un enlace a la home. */
  asLink?: boolean;
}

export function Logo({
  size = 44,
  withWordmark = true,
  withTagline = false,
  taglineClassName,
  tone = "ink",
  className,
  asLink = true,
}: LogoProps) {
  const showWordmark = withWordmark && !LOGO_INCLUDES_WORDMARK;

  const badge =
    tone === "cream" ? (
      // Sobre el marrón oscuro se recorta la silueta del sello y se rellena
      // con el crema de la marca, en vez de encajarlo en una chapa clara.
      <span
        aria-hidden="true"
        className="block shrink-0 bg-cream"
        style={{
          width: size,
          height: size,
          maskImage: "url(/logo-mono.png)",
          WebkitMaskImage: "url(/logo-mono.png)",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
    ) : (
      <Image
        src="/logo.png"
        alt={showWordmark ? "" : siteConfig.name}
        aria-hidden={showWordmark || undefined}
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
    );

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {badge}
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-lg font-semibold tracking-tight sm:text-xl",
              tone === "cream" ? "text-cream" : "text-ink",
            )}
          >
            {siteConfig.name}
          </span>
          {withTagline ? (
            <span
              className={cn(
                "mt-1 text-[0.72rem] font-medium tracking-[0.14em] uppercase",
                tone === "cream" ? "text-cheese" : "text-bark",
                taglineClassName,
              )}
            >
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
