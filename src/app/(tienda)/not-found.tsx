import Link from "next/link";

import { buttonStyles } from "@/components/ui/button-styles";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.18em] text-olive uppercase">Error 404</p>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Esta página no existe
      </h1>
      <p className="max-w-md text-base text-bark">
        Puede que el enlace esté viejo. Volvé al catálogo y seguí armando tu pedido.
      </p>
      <Link href="/" className={buttonStyles("primary", "lg", "mt-2")}>
        Ir al inicio
      </Link>
    </div>
  );
}
