import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BarraAdmin } from "@/components/admin/BarraAdmin";
import { FormularioProducto } from "@/components/admin/FormularioProducto";

export const metadata: Metadata = {
  title: "Nuevo producto",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function NuevoProductoPage() {
  return (
    <>
      <BarraAdmin />
      <main className="container-page flex-1 py-8 sm:py-10">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-bark transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver al listado
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
          Nuevo producto
        </h1>
        <div className="mt-6 max-w-3xl">
          <FormularioProducto />
        </div>
      </main>
    </>
  );
}
