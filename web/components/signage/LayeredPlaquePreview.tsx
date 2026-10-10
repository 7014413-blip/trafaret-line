"use client";

// Live preview of a two-layer plaque: the offset back plate of number plaques, the plate with
// its corners, the mirror frame or edging and the raised letters with a soft shadow. Number
// plaques show the number in the back colour, as it is cut through the front plate.

import { useId } from "react";
import type { LayeredPlaqueKind, LayeredPlaqueLayout, LayeredPlaqueMaterial } from "@/types/layered-plaque";

function Mirror({ id, sheet }: { id: string; sheet: LayeredPlaqueMaterial }) {
  if (!sheet.mirror) return null;
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={sheet.hex} />
      <stop offset=".35" stopColor="#fbf7e8" />
      <stop offset=".5" stopColor={sheet.hex} />
      <stop offset=".8" stopColor="#f8fafc" />
      <stop offset="1" stopColor={sheet.hex} />
    </linearGradient>
  );
}

export function LayeredPlaquePreview({ kind, layout, linePaths, base, overlay, label }: {
  kind: LayeredPlaqueKind;
  layout: LayeredPlaqueLayout;
  linePaths: Map<number, string>;
  base: LayeredPlaqueMaterial;
  overlay: LayeredPlaqueMaterial;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const w = layout.widthMm;
  const h = layout.heightMm;
  const pad = Math.max(w, h) * 0.1;
  const p = layout.plate;
  const short = Math.min(p.width, p.height);
  const baseFill = base.mirror ? `url(#b${uid})` : base.hex;
  const overlayFill = overlay.mirror ? `url(#o${uid})` : overlay.hex;
  const lift = Math.max(0.3, short * 0.006);

  return (
    <svg viewBox={`${-w / 2 - pad} ${-h / 2 - pad} ${w + pad * 2} ${h + pad * 2}`} className="block h-auto max-h-[62vh] w-full" role="img" aria-label={label}>
      <defs>
        <Mirror id={`b${uid}`} sheet={base} />
        <Mirror id={`o${uid}`} sheet={overlay} />
        <filter id={`s${uid}`} x="-15%" y="-15%" width="130%" height="140%">
          <feDropShadow dx="0" dy={short * 0.025} stdDeviation={short * 0.03} floodOpacity=".28" />
        </filter>
        <filter id={`r${uid}`} x="-5%" y="-10%" width="110%" height="130%">
          <feDropShadow dx={lift * 0.5} dy={lift} stdDeviation={lift * 0.7} floodColor="#000" floodOpacity=".45" />
        </filter>
      </defs>
      {layout.back && (
        <rect x={layout.back.x} y={layout.back.y} width={layout.back.width} height={layout.back.height} rx={layout.cornerMm}
          fill={overlayFill} filter={`url(#s${uid})`} />
      )}
      <rect x={p.x} y={p.y} width={p.width} height={p.height} rx={layout.cornerMm} fill={baseFill}
        stroke="rgba(15,23,42,.18)" strokeWidth={Math.max(0.2, short / 400)} filter={`url(#s${uid})`} />
      <g filter={kind === "number" ? undefined : `url(#r${uid})`}>
        {layout.frame && (
          <rect x={layout.frame.x} y={layout.frame.y} width={layout.frame.width} height={layout.frame.height} rx={layout.frame.corner}
            fill="none" stroke={overlayFill} strokeWidth={layout.frame.stroke} />
        )}
        {layout.lines.map((line) => {
          const d = linePaths.get(line.index);
          return d ? <path key={line.index} d={d} fill={overlayFill} transform={`translate(${line.x} ${line.y}) scale(${line.scale})`} /> : null;
        })}
      </g>
    </svg>
  );
}
