import { siteConfig } from "@/config/site";

const steps = [
  {
    title: "Elegí tus productos",
    description:
      "Recorré el catálogo, seleccioná los kilos o las unidades y sumá todo al carrito.",
  },
  {
    title: "Completá tus datos",
    description:
      "Nombre, teléfono y si preferís envío o retiro. No hace falta crear ninguna cuenta.",
  },
  {
    title: "Coordinamos el pago y la entrega",
    description:
      "Te escribimos para confirmar el pedido, pasarte los datos de la transferencia y acordar la entrega.",
  },
];

export function HowToBuy() {
  return (
    <section id="como-comprar" className="scroll-mt-24 border-y border-ink/10 bg-card py-14 sm:py-18">
      <div className="container-page">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-olive uppercase">
            Cómo comprar
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Tres pasos y listo
          </h2>
        </header>

        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-card border border-ink/10 bg-cream p-5 sm:p-6"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-cream"
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bark">{step.description}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 rounded-card border-2 border-dashed border-cheese/60 bg-cheese/10 p-5 text-sm leading-relaxed text-ink sm:text-base">
          Una vez confirmado el pedido, nos comunicaremos contigo para enviarte los datos de la
          transferencia bancaria y coordinar la entrega o el retiro.
        </p>
        <p className="sr-only">{siteConfig.paymentNotice}</p>
      </div>
    </section>
  );
}
