import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen de Open Graph generada con la paleta de la marca. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #F5EEDF 0%, #ECDFC4 100%)",
          color: "#4A2E1E",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="98" fill="#4A2E1E" />
            <circle cx="100" cy="100" r="88" fill="#F5EEDF" />
            <path
              d="M48 152h104L100 64z"
              fill="#D9A441"
              stroke="#4A2E1E"
              strokeWidth="9"
              strokeLinejoin="round"
            />
            <circle cx="86" cy="126" r="9" fill="#F5EEDF" stroke="#4A2E1E" strokeWidth="5" />
            <circle cx="116" cy="136" r="6" fill="#F5EEDF" stroke="#4A2E1E" strokeWidth="5" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#727252",
            }}
          >
            Quesería artesanal
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 48, fontSize: 82, fontWeight: 700, lineHeight: 1.05 }}>
          Quesos con carácter,
        </div>
        <div style={{ display: "flex", fontSize: 82, fontWeight: 700, lineHeight: 1.05 }}>
          directo a tu mesa
        </div>
        <div style={{ display: "flex", marginTop: 34, fontSize: 34, color: "#76513A" }}>
          {siteConfig.name} · Uruguay
        </div>
      </div>
    ),
    size,
  );
}
