import Link from "next/link";
import { Camera, MessageCircle } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { siteConfig, whatsappLink } from "@/config/site";

const footerLinks = [
  { href: "/#productos", label: "Productos" },
  { href: "/#como-comprar", label: "Cómo comprar" },
  { href: "/#contacto", label: "Contacto" },
  { href: "/carrito", label: "Mi carrito" },
];

export function Footer() {
  const { contact } = siteConfig;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 bg-ink text-cream">
      <div className="container-page grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Logo size={52} tone="cream" withTagline asLink={false} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">
            {siteConfig.shortDescription}
          </p>
        </div>

        <nav aria-label="Navegación del pie de página">
          <h2 className="font-display text-base font-semibold">Navegación</h2>
          <ul className="mt-3 space-y-1">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm text-cream/80 transition-colors hover:text-cheese focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheese"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-base font-semibold">Contacto</h2>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-cheese focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheese"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                {contact.whatsappDisplay}
              </a>
            </li>
            {contact.instagramHandle && contact.instagramUrl ? (
              <li>
                <a
                  href={contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-cheese focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheese"
                >
                  <Camera aria-hidden="true" className="size-4" />
                  {contact.instagramHandle}
                </a>
              </li>
            ) : null}
            {contact.address ? <li className="pt-1">{contact.address}</li> : null}
            {contact.hours.length > 0 ? (
              <li className="pt-1">
                {contact.hours[0].days}: {contact.hours[0].time}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/15">
        <div className="container-page flex flex-col gap-1.5 py-5 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Todos los derechos reservados.
          </p>
          <p className="font-display text-sm tracking-wide text-cream/75">
            {siteConfig.name} — {siteConfig.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
