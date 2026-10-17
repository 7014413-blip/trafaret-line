// Default social preview (1200 × 630) for pages without their own picture.
// Latin text only: the built-in font of next/og has no Cyrillic glyphs.

import { ImageResponse } from "next/og";
import { SITE } from "@/data/site";

export const alt = "Trafaret Line";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0f172a", color: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 96, height: 96, border: "6px dashed #fafafa", borderRadius: 20 }} />
          <div style={{ fontSize: 88, fontWeight: 700 }}>Trafaret Line</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, opacity: 0.8 }}>{SITE.domain}</div>
      </div>
    ),
    size,
  );
}
