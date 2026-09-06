import Link from "next/link";
import { LogOut, Store } from "lucide-react";

import { accionCerrarSesion } from "@/app/admin/actions";
import { Logo } from "@/components/ui/Logo";

/** Cabecera del panel: identidad, vuelta a la tienda y cierre de sesión. */
export function BarraAdmin() {
  return (
    <header className="border-b border-ink/10 bg-card">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
        <Logo size={40} withWordmark asLink={false} />

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-bark transition-colors hover:bg-ink/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Store aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Ver la tienda</span>
          </Link>

          <form action={accionCerrarSesion}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink/15 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink/45 hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
