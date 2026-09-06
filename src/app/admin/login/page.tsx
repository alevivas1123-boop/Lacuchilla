import type { Metadata } from "next";

import { FormularioLogin } from "@/components/admin/FormularioLogin";
import { Logo } from "@/components/ui/Logo";
import { variablesFaltantes } from "@/lib/env";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  const { volver } = await searchParams;
  // Si falta configuración se avisa acá, sin decir qué valor tiene ninguna.
  const faltantes = variablesFaltantes();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo size={72} withWordmark={false} asLink={false} />
        </div>

        <h1 className="mt-6 text-center font-display text-2xl font-semibold text-ink">
          Administración
        </h1>
        <p className="mt-2 text-center text-sm text-bark">
          Ingresá para administrar el catálogo de La Cuchilla.
        </p>

        {faltantes.length > 0 ? (
          <div
            role="alert"
            className="mt-6 rounded-card border-2 border-[#9B3B1F]/40 bg-[#9B3B1F]/8 p-4 text-sm leading-relaxed text-ink"
          >
            <p className="font-semibold">El panel no está configurado en este entorno.</p>
            <p className="mt-1">
              Faltan estas variables de entorno: {faltantes.join(", ")}. Configuralas en Vercel y
              volvé a desplegar.
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-card border border-ink/10 bg-card p-5 sm:p-6">
          <FormularioLogin volver={volver} deshabilitado={faltantes.length > 0} />
        </div>
      </div>
    </main>
  );
}
