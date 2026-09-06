import fs from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** El sello se incrusta como data URI: se resuelve al construir el sitio. */
function readLogoDataUri(): string | null {
  try {
    const file = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Imagen de Open Graph: el sello de la marca sobre la paleta de la casa. */
export default function OpenGraphImage() {
  const logo = readLogoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 88px",
          background: "linear-gradient(135deg, #F5EEDF 0%, #ECDFC4 100%)",
          color: "#4A2E1E",
          fontFamily: "sans-serif",
        }}
      >
        {logo ? (
          <img src={logo} alt="" width={300} height={300} />
        ) : null}

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#727252",
            }}
          >
            Quesería artesanal uruguaya
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 68, fontWeight: 700, lineHeight: 1.08 }}>
            Quesos con carácter,
          </div>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.08 }}>
            directo a tu mesa
          </div>
          <div style={{ display: "flex", marginTop: 30, fontSize: 30, color: "#76513A" }}>
            Quesos, dulces y mermeladas · Pedidos por la web
          </div>
        </div>
      </div>
    ),
    size,
  );
}
