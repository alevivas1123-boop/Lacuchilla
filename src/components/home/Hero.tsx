import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button-styles";

/**
 * Composición del hero. Si existe /public/hero.webp se usa esa foto;
 * si no, se dibuja una escena de marca que se puede reemplazar sin tocar código.
 */
function HeroVisual({ hasPhoto }: { hasPhoto: boolean }) {
  if (hasPhoto) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card shadow-lifted">
        <Image
          src="/hero.webp"
          alt="Tabla de quesos y dulces artesanales de La Cuchilla"
          fill
          priority
          sizes="(min-width: 1024px) 520px, 92vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-ink/10 bg-card shadow-lifted"
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_20%_0%,#F7E7C2_0%,#F0E0C4_45%,#E9D8BC_100%)]" />
      <svg viewBox="0 0 400 300" className="absolute inset-0 size-full">
        <circle
          cx="200"
          cy="150"
          r="118"
          fill="none"
          stroke="#D9A441"
          strokeWidth="2"
          strokeDasharray="5 8"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Tabla */}
        <rect x="72" y="196" width="256" height="20" rx="10" fill="#76513A" opacity="0.25" />
        {/* Cuña grande */}
        <path
          d="M118 198h124L180 96z"
          fill="#D9A441"
          stroke="#4A2E1E"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <circle cx="158" cy="170" r="11" fill="#F5EEDF" stroke="#4A2E1E" strokeWidth="4.5" />
        <circle cx="192" cy="182" r="7" fill="#F5EEDF" stroke="#4A2E1E" strokeWidth="4.5" />
        <circle cx="180" cy="140" r="6" fill="#F5EEDF" stroke="#4A2E1E" strokeWidth="4.5" />
        {/* Horma en pie */}
        <ellipse cx="272" cy="160" rx="46" ry="16" fill="#EBC978" stroke="#4A2E1E" strokeWidth="6" />
        <path
          d="M226 160v30c0 9 21 16 46 16s46-7 46-16v-30"
          fill="#E0B75E"
          stroke="#4A2E1E"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Frasco de dulce */}
        <rect x="82" y="130" width="46" height="66" rx="8" fill="#B4703F" stroke="#4A2E1E" strokeWidth="6" />
        <rect x="78" y="118" width="54" height="16" rx="6" fill="#727252" stroke="#4A2E1E" strokeWidth="6" />
      </svg>
      <p className="absolute right-4 bottom-4 rounded-full bg-cream/85 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] text-bark uppercase">
        Elaboración artesanal
      </p>
    </div>
  );
}

export function Hero({ hasPhoto }: { hasPhoto: boolean }) {
  return (
    <section className="border-b border-ink/10 bg-cream">
      <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
        <div className="max-w-xl">
          <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-olive uppercase">
            Quesería artesanal uruguaya
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-semibold text-balance text-ink sm:text-5xl lg:text-6xl">
            Quesos con carácter, directo a tu mesa
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-bark">
            Quesos, dulces y sabores seleccionados para compartir y disfrutar todos los días.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/#productos" className={buttonStyles("primary", "lg", "w-full sm:w-auto")}>
              Ver productos
            </Link>
            <Link
              href="/#como-comprar"
              className={buttonStyles("outline", "lg", "w-full sm:w-auto")}
            >
              Cómo comprar
            </Link>
          </div>
        </div>

        <HeroVisual hasPhoto={hasPhoto} />
      </div>
    </section>
  );
}
