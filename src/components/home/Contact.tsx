import { Camera, Clock, MapPin, MessageCircle } from "lucide-react";

import { siteConfig, whatsappLink } from "@/config/site";

export function Contact() {
  const { contact } = siteConfig;

  return (
    <section id="contacto" className="scroll-mt-24 bg-cream py-14 sm:py-18">
      <div className="container-page">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-olive uppercase">
            Contacto
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Escribinos cuando quieras
          </h2>
          <p className="mt-3 text-base text-bark">
            Dudas sobre un producto, pedidos grandes o para coordinar una entrega: estamos del otro
            lado.
          </p>
        </header>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-card border border-ink/10 bg-card p-5">
            <MessageCircle aria-hidden="true" className="size-5 text-olive" />
            <h3 className="mt-3 font-display text-base font-semibold text-ink">WhatsApp</h3>
            <a
              href={whatsappLink(`Hola ${siteConfig.name}, quisiera hacer una consulta.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-bark underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {contact.whatsappDisplay}
            </a>
          </li>

          <li className="rounded-card border border-ink/10 bg-card p-5">
            <Camera aria-hidden="true" className="size-5 text-olive" />
            <h3 className="mt-3 font-display text-base font-semibold text-ink">Instagram</h3>
            <a
              href={contact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-bark underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {contact.instagramHandle}
            </a>
          </li>

          <li className="rounded-card border border-ink/10 bg-card p-5">
            <MapPin aria-hidden="true" className="size-5 text-olive" />
            <h3 className="mt-3 font-display text-base font-semibold text-ink">Dónde estamos</h3>
            <p className="mt-1 text-sm text-bark">{contact.address}</p>
          </li>

          <li className="rounded-card border border-ink/10 bg-card p-5">
            <Clock aria-hidden="true" className="size-5 text-olive" />
            <h3 className="mt-3 font-display text-base font-semibold text-ink">Horarios</h3>
            <dl className="mt-1 space-y-0.5 text-sm text-bark">
              {contact.hours.map((entry) => (
                <div key={entry.days} className="flex justify-between gap-3">
                  <dt>{entry.days}</dt>
                  <dd className="text-right font-medium text-ink/80">{entry.time}</dd>
                </div>
              ))}
            </dl>
          </li>
        </ul>
      </div>
    </section>
  );
}
