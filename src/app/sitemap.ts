import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** Solo las páginas públicas. /admin queda deliberadamente afuera. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
}
