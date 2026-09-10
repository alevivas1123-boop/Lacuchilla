"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, MapPin, Package, Settings } from "lucide-react";

import { cn } from "@/lib/cn";

const SECCIONES = [
  { href: "/admin/pedidos", label: "Pedidos", Icono: ClipboardList },
  { href: "/admin", label: "Productos", Icono: Package },
  { href: "/admin/puntos", label: "Puntos de retiro", Icono: MapPin },
  { href: "/admin/configuracion", label: "Configuración", Icono: Settings },
] as const;

/**
 * Navegación del panel.
 *
 * En el celular se desplaza en horizontal en vez de apilarse: el dueño usa
 * esto parado, con el banco abierto en otra app, y una barra de cuatro filas
 * le comería la pantalla.
 */
export function NavAdmin() {
  const ruta = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="border-b border-ink/10 bg-card">
      <ul className="container-page flex gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECCIONES.map(({ href, label, Icono }) => {
          // "/admin" es la sección de productos: solo coincide exacto, si no
          // se marcaría como activa en todas las demás.
          const activa = href === "/admin" ? ruta === "/admin" : ruta.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  activa
                    ? "bg-ink text-cream"
                    : "text-bark hover:bg-ink/8 hover:text-ink",
                )}
              >
                <Icono aria-hidden="true" className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
