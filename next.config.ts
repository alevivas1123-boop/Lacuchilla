import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Las fotos cargadas desde el panel viven en Vercel Blob, que es un dominio
     * externo. `next/image` se niega a optimizar lo que no esté declarado acá y
     * responde 400, así que sin esta regla la foto nueva no se ve en ningún lado.
     *
     * El subdominio lleva el identificador del store, que cambia si alguna vez
     * se recrea; por eso va con comodín. La ruta sí queda acotada a `productos/`,
     * que es lo único que sube el panel: evita que el optimizador del sitio sirva
     * imágenes de cualquier otro store público.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/productos/**",
      },
    ],
  },
};

export default nextConfig;
