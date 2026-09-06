import type { Metadata } from "next";

import { CartPage } from "@/components/cart/CartPage";
import { getAvailableProductImages } from "@/lib/product-images.server";

export const metadata: Metadata = {
  title: "Tu carrito",
  description: "Revisá los productos de tu pedido antes de confirmarlo.",
  robots: { index: false, follow: true },
};

export default function CarritoPage() {
  return <CartPage availableImages={getAvailableProductImages()} />;
}
