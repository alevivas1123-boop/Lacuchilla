import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { BarraAdmin } from "@/components/admin/BarraAdmin";
import { FormularioConfiguracion } from "@/components/admin/FormularioConfiguracion";
import { obtenerConfiguracion } from "@/db/queries-pedidos";
import type { StoreSettingsRow } from "@/db/schema";
import { datosBancariosCompletos } from "@/lib/settings-schema";

export const metadata: Metadata = {
  title: "Configuración",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const { guardado } = await searchParams;

  let configuracion: StoreSettingsRow | undefined;
  let errorBase: string | undefined;
  try {
    configuracion = await obtenerConfiguracion();
  } catch {
    errorBase =
      "No se pudo conectar con la base de datos. Revisá la variable DATABASE_URL del entorno.";
  }

  return (
    <>
      <BarraAdmin />

      <main className="container-page flex-1 py-8 sm:py-10">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Configuración</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-bark">
          Estos datos viven en la base y no en el código: si cambia la cuenta, lo cambiás acá y se
          ve al instante, sin esperar a que nadie publique nada.
        </p>

        {guardado ? (
          <p
            role="status"
            className="mt-5 rounded-card border-2 border-olive/30 bg-olive/10 px-4 py-3 text-sm font-medium text-ink"
          >
            Configuración guardada.
          </p>
        ) : null}

        {errorBase ? (
          <p
            role="alert"
            className="mt-5 rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 px-4 py-3 text-sm font-medium text-ink"
          >
            {errorBase}
          </p>
        ) : null}

        {configuracion && !datosBancariosCompletos(configuracion) ? (
          <p className="mt-5 flex items-start gap-3 rounded-card border-2 border-cheese/60 bg-cheese/10 px-4 py-3 text-sm leading-relaxed text-ink">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cheese-deep" />
            <span>
              Faltan los datos bancarios. Hasta que los cargues, la pantalla de confirmación le va a
              pedir al cliente que te escriba por WhatsApp para saber dónde transferir.
            </span>
          </p>
        ) : null}

        {configuracion ? (
          <div className="mt-6 max-w-2xl">
            <FormularioConfiguracion configuracion={configuracion} />
          </div>
        ) : null}
      </main>
    </>
  );
}
