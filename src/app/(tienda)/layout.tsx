import { CartDrawer } from "@/components/cart/CartDrawer";
import { AvisoImagenesProvisorias } from "@/components/dev/AvisoImagenesProvisorias";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/**
 * Estructura de la tienda pública: cabecera, contenido, pie y carrito lateral.
 * El panel de administración vive fuera de este grupo y no arrastra nada de
 * esto.
 */
export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[80] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-cream"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <AvisoImagenesProvisorias />
    </>
  );
}
