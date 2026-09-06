import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { AvisoImagenesProvisorias } from "@/components/dev/AvisoImagenesProvisorias";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toaster";
import { siteConfig } from "@/config/site";
import { getAvailableProductImages } from "@/lib/product-images.server";

import "./globals.css";

/** Serif con personalidad para títulos. */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

/** Sans muy legible para precios, botones y formularios. */
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.shortDescription,
  applicationName: siteConfig.name,
  keywords: [
    "quesos",
    "quesería artesanal",
    "Uruguay",
    "dulce de leche",
    "mermeladas",
    "queso colonia",
    "chorizo casero",
  ],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.shortDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.shortDescription,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F5EEDF",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Se resuelve en el servidor: qué productos ya tienen su foto real.
  const availableImages = getAvailableProductImages();

  return (
    <html lang="es-UY" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <ToastProvider>
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
          <CartDrawer availableImages={availableImages} />
          <AvisoImagenesProvisorias />
        </ToastProvider>
      </body>
    </html>
  );
}
