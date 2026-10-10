"use client";

// Welded word preview: the piece as it comes off the laser, in the colour of the
// chosen sheet (mirror gold / silver get a metallic gradient), on plastic or on a cake.

import type { MaterialOption } from "@/types/customizer";
import type { WeldResult } from "@/types/geometry";
import { polygonsToPathData } from "@/lib/geometry/svg-path";

export type WeldView = "piece" | "cake";

export function WeldPreview({ weld, material, colourHex, view }: { weld: WeldResult; material: MaterialOption; colourHex: string; view: WeldView }) {
  const w = weld.bbox.maxX - weld.bbox.minX;
  const h = weld.bbox.maxY - weld.bbox.minY;
  const pad = Math.max(w, h) * 0.08;
  const mirror = material.finish === "mirror";
  const clear = colourHex.toLowerCase() === "#eef6fb";
  const d = polygonsToPathData(weld.shapes);
  return (
    <svg viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`} className="block h-auto max-h-[60vh] w-full" role="img"
      aria-label={`Превʼю виробу ${Math.round(w / 10)}×${Math.round(h / 10)} см`}>
      <defs>
        <linearGradient id="weld-mirror" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colourHex} />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.55" stopColor={colourHex} />
          <stop offset="1" stopColor={colourHex} />
        </linearGradient>
      </defs>
      <rect x={-pad} y={-pad} width={w + pad * 2} height={h + pad * 2} fill={view === "cake" ? "#f3e4cc" : "#f1f5f9"} />
      {/* Clear acrylic is almost invisible on a light background: a darker edge shows the real outline. */}
      <path d={d} fill={mirror ? "url(#weld-mirror)" : colourHex} fillRule="nonzero"
        stroke={clear ? "#475569" : material.look.edge} strokeWidth={Math.max(clear ? 0.5 : 0.3, w / (clear ? 350 : 600))} />
    </svg>
  );
}
