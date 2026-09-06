import { Benefits } from "@/components/home/Benefits";
import { Catalog } from "@/components/home/Catalog";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { HowToBuy } from "@/components/home/HowToBuy";
import { getProductsWithImages, hasPublicFile } from "@/lib/product-images.server";

export default function HomePage() {
  const products = getProductsWithImages();

  return (
    <>
      <Hero hasPhoto={hasPublicFile("hero.webp")} />
      <Benefits />
      <Catalog products={products} />
      <HowToBuy />
      <Contact />
    </>
  );
}
