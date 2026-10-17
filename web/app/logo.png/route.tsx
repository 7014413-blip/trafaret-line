// /logo.png: square logo (512 × 512) for the Organization markup and the Merchant Center
// profile: the dashed stencil frame of the header on the anthracite brand colour.

import { ImageResponse } from "next/og";

export const dynamic = "force-static";

const SIZE = 512;

export function GET(): ImageResponse {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
        <div style={{ width: 300, height: 300, display: "flex", alignItems: "center", justifyContent: "center", border: "20px dashed #fafafa", borderRadius: 64, color: "#fafafa", fontSize: 120, fontWeight: 700 }}>
          TL
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}
