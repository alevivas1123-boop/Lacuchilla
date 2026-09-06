import { Benefits } from "@/components/home/Benefits";
import { Catalog } from "@/components/home/Catalog";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { HowToBuy } from "@/components/home/HowToBuy";
import { CatalogoNoDisponible } from "@/components/home/CatalogoNoDisponible";
import { obtenerCatalogo } from "@/lib/catalogo.server";
import { hasPublicFile } from "@/lib/public-assets.server";

/**
 * El catálogo se lee de PostgreSQL en cada visita, con la consulta cacheada y
 * etiquetada: los cambios del panel aparecen apenas se guardan.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const hero = <Hero hasPhoto={hasPublicFile("hero.webp")} />;

  let productos;
  try {
    productos = await obtenerCatalogo();
  } catch {
    // No se cae a un catálogo alternativo: mostrar precios distintos a los de
    // la base sería peor que decir que la tienda está momentáneamente caída.
    return (
      <>
        {hero}
        <Benefits />
        <CatalogoNoDisponible />
        <HowToBuy />
        <Contact />
      </>
    );
  }

  return (
    <>
      {hero}
      <Benefits />
      <Catalog products={productos} />
      <HowToBuy />
      <Contact />
    </>
  );
}
