import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** El panel de administración no se indexa ni aparece en el sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
