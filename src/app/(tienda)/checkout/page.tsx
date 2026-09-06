import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Dejanos tus datos y coordinamos el pago y la entrega.",
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Finalizá tu pedido
        </h1>
        <p className="mt-3 text-base text-bark">
          No hace falta crear una cuenta. Con tu nombre y un teléfono alcanza: después te
          escribimos para coordinar el pago y la entrega.
        </p>
      </header>

      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
