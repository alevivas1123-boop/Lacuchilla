import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BarraAdmin } from "@/components/admin/BarraAdmin";
import { FormularioPunto } from "@/components/admin/FormularioPunto";

export const metadata: Metadata = {
  title: "Nuevo punto de retiro",
  robots: { index: false, follow: false },
};

export default function NuevoPuntoPage() {
  return (
    <>
      <BarraAdmin />

      <main className="container-page flex-1 py-8 sm:py-10">
        <Link
          href="/admin/puntos"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-bark transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver a los puntos
        </Link>

        <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
          Nuevo punto de retiro
        </h1>

        <div className="mt-6 max-w-2xl">
          <FormularioPunto />
        </div>
      </main>
    </>
  );
}
