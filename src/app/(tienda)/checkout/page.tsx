import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX } from "lucide-react";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { buttonStyles } from "@/components/ui/button-styles";
import { whatsappLink } from "@/config/site";
import { puntosParaElegir } from "@/lib/retiros.server";
import type { PuntoParaElegir } from "@/lib/retiros";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Elegí dónde y cuándo retirás tu pedido.",
  robots: { index: false, follow: true },
};

// Las fechas dependen del reloj: una página cacheada ofrecería el jueves que
// ya pasó.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let puntos: PuntoParaElegir[] = [];
  let falloLaBase = false;
  try {
    puntos = await puntosParaElegir();
  } catch {
    falloLaBase = true;
  }

  if (puntos.length === 0) {
    return (
      <div className="container-page py-10 sm:py-14">
        <div className="mx-auto max-w-xl rounded-card border border-ink/10 bg-card p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-cheese/20 text-cheese-deep">
            <CalendarX aria-hidden="true" className="size-7" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold text-ink">
            {falloLaBase ? "No podemos tomar pedidos ahora" : "No hay fechas de retiro abiertas"}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-bark">
            {falloLaBase
              ? "Tuvimos un problema para cargar la página. Probá de nuevo en unos minutos o escribinos y lo coordinamos por ahí."
              : "Los pedidos de las próximas entregas ya cerraron. Escribinos por WhatsApp y vemos cómo te lo hacemos llegar."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={whatsappLink("Hola, quiero hacer un pedido.")}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles("primary", "lg")}
            >
              Escribinos por WhatsApp
            </a>
            <Link href="/carrito" className={buttonStyles("outline", "lg")}>
              Volver al carrito
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Finalizá tu pedido
        </h1>
        <p className="mt-3 text-base text-bark">
          No hace falta crear una cuenta. Elegí dónde y qué día lo retirás, dejanos tus datos y en
          la pantalla siguiente te damos los datos para transferir.
        </p>
      </header>

      <div className="mt-8">
        <CheckoutForm puntos={puntos} />
      </div>
    </div>
  );
}
