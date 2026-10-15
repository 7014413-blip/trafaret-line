"use client";

// Live preview of an office plaque: the acrylic base, the mirror plate on top with a light
// shadow (two layers), and the engraved text in the plate's engraving colour. Satin plates
// get a soft brushed gradient, glossy ones a bright diagonal highlight.

import { useId } from "react";
import { PlacedLinePaths } from "@/components/signage/PlacedLinePaths";
import { PreviewSvg } from "@/components/signage/PreviewSvg";
import type { OfficePlaqueLayout, PlaqueBaseColour, PlaquePlateColour } from "@/types/office-plaque";

export function OfficePlaquePreview({ layout, linePaths, base, plate, label }: {
  layout: OfficePlaqueLayout;
  linePaths: Map<number, string>;
  base: PlaqueBaseColour;
  plate: PlaquePlateColour;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const w = layout.widthMm;
  const h = layout.heightMm;
  const pad = Math.max(w, h) * 0.08;
  const p = layout.plate;
  const stops = plate.satin
    ? [[0, plate.highlight], [0.5, plate.hex], [1, plate.highlight]]
    : [[0, plate.hex], [0.38, plate.highlight], [0.5, plate.hex], [0.78, plate.highlight], [1, plate.hex]];

  return (
    <PreviewSvg viewBox={[-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2]} label={label}>
      <defs>
        <linearGradient id={`p${uid}`} x1="0" y1="0" x2="1" y2={plate.satin ? 0 : 1}>
          {stops.map(([o, c]) => <stop key={String(o)} offset={Number(o)} stopColor={String(c)} />)}
        </linearGradient>
        <filter id={`s${uid}`} x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow dx="0" dy={h * 0.04} stdDeviation={h * 0.05} floodOpacity=".25" />
        </filter>
        <filter id={`r${uid}`} x="-5%" y="-10%" width="110%" height="130%">
          <feDropShadow dx="0" dy={Math.max(0.3, h * 0.008)} stdDeviation={Math.max(0.3, h * 0.008)} floodOpacity=".35" />
        </filter>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={Math.min(w, h) * 0.015} fill={base.hex} stroke="rgba(15,23,42,.25)" strokeWidth={Math.max(0.2, w / 800)} filter={`url(#s${uid})`} />
      <rect x={p.x} y={p.y} width={p.width} height={p.height} fill={`url(#p${uid})`} filter={`url(#r${uid})`} />
      <PlacedLinePaths lines={layout.lines} paths={linePaths} fill={plate.engraveHex} />
    </PreviewSvg>
  );
}
