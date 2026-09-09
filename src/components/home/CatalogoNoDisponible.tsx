import { AlertTriangle } from "lucide-react";

import { siteConfig, whatsappLink } from "@/config/site";
import { buttonStyles } from "@/components/ui/button-styles";

/**
 * Estado de error del catálogo.
 *
 * Aparece cuando no se puede leer la base. A propósito no se muestra ningún
 * producto: enseñar precios que quizá no son los vigentes sería peor que
 * avisar que la tienda está caída un momento.
 */
export function CatalogoNoDisponible() {
  return (
    <section id="productos" className="scroll-mt-24 bg-cream py-14 sm:py-20">
      <div className="container-page">
        <div className="mx-auto max-w-xl rounded-card border border-ink/10 bg-card p-6 text-center sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-cheese/20 text-cheese-deep">
            <AlertTriangle aria-hidden="true" className="size-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold text-ink sm:text-3xl">
            El catálogo no está disponible en este momento
          </h2>
          <p className="mt-3 text-base leading-relaxed text-bark">
            Estamos teniendo un problema para cargar los productos. Volvé a intentar en unos
            minutos, o escribinos y armamos tu pedido por WhatsApp.
          </p>
          <a
            href={whatsappLink(`Hola ${siteConfig.name}, quisiera hacer un pedido.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles("primary", "lg", "mt-6")}
          >
            Escribinos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
