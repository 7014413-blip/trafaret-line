"use client";

// Live preview of a business sign: the base in its sheet colour, the raised overlay (text lines,
// edge text, logo, frame) with a soft shadow so the second layer reads as volume. Every text
// line may have its own sheet. Mirror sheets get a light gradient. The logo picture is tinted
// with its sheet: dark parts of the picture (or light parts when inverted) become the overlay.
// Mounting holes are drawn as the metal standoff caps.

import { useId } from "react";
import { findBusinessSignSheet } from "@/lib/business-sign/palette";
import type { BusinessSignDesign, BusinessSignLayout } from "@/types/business-sign";
import type { AcrylicSheet } from "@/types/signage";

const points = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

function MirrorGradient({ id, sheet }: { id: string; sheet: AcrylicSheet }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#f8fafc" />
      <stop offset=".42" stopColor={sheet.hex} />
      <stop offset=".58" stopColor="#f8fafc" />
      <stop offset="1" stopColor={sheet.hex} />
    </linearGradient>
  );
}

export function BusinessSignPreview({ design, layout, linePaths, logoUrl, label }: {
  design: BusinessSignDesign;
  layout: BusinessSignLayout;
  /** SVG path of every text line in layout units, by line index. */
  linePaths: Map<number, string>;
  logoUrl: string | null;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const w = layout.widthMm;
  const h = layout.heightMm;
  const pad = Math.max(w, h) * 0.07;
  const shadow = Math.max(0.6, Math.min(w, h) * 0.008);

  // Every sheet used on the sign, once, with its gradient when it is a mirror.
  const used = new Set<string>([design.baseMaterialId, ...design.lines.map((l) => l.materialId)]);
  if (design.logo) used.add(design.logo.materialId);
  if (design.arc) used.add(design.arc.materialId);
  if (design.frameMaterialId) used.add(design.frameMaterialId);
  const sheets = [...used].map(findBusinessSignSheet);
  const fill = (id: string) => {
    const sheet = findBusinessSignSheet(id);
    return sheet.finish === "mirror" ? `url(#m${uid}-${sheet.id})` : sheet.hex;
  };
  const baseSheet = findBusinessSignSheet(design.baseMaterialId);
  const logoSheet = design.logo ? findBusinessSignSheet(design.logo.materialId) : null;
  // Alpha from luminance: dark pixels opaque (normal) or light pixels opaque (inverted).
  const alphaRow = design.logo?.invert ? "0.2126 0.7152 0.0722 1 -1" : "-0.2126 -0.7152 -0.0722 1 0";
  const arcFill = design.arc ? fill(design.arc.materialId) : "none";
  const capR = Math.max(4, Math.min(w, h) * 0.016);

  return (
    <svg viewBox={`${-w / 2 - pad} ${-h / 2 - pad} ${w + pad * 2} ${h + pad * 2}`} className="block h-auto max-h-[62vh] w-full" role="img" aria-label={label}>
      <defs>
        {sheets.filter((s) => s.finish === "mirror").map((s) => <MirrorGradient key={s.id} id={`m${uid}-${s.id}`} sheet={s} />)}
        <radialGradient id={`cap${uid}`} cx=".35" cy=".35" r=".75">
          <stop offset="0" stopColor="#fff7dd" />
          <stop offset=".5" stopColor="#c9a24a" />
          <stop offset="1" stopColor="#7a5a1c" />
        </radialGradient>
        <filter id={`s${uid}`} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy={h * 0.015} stdDeviation={h * 0.02} floodOpacity=".28" />
        </filter>
        <filter id={`r${uid}`} x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx={shadow * 0.5} dy={shadow} stdDeviation={shadow * 0.6} floodColor="#000" floodOpacity=".45" />
        </filter>
        {logoSheet && (
          <filter id={`l${uid}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${alphaRow}`} result="a" />
            <feComponentTransfer in="a" result="m"><feFuncA type="linear" slope="2.4" intercept="-0.6" /></feComponentTransfer>
            <feFlood floodColor={logoSheet.hex} result="c" />
            <feComposite in="c" in2="m" operator="in" />
          </filter>
        )}
      </defs>

      <polygon points={points(layout.outline)} fill={fill(baseSheet.id)} stroke="rgba(15,23,42,.25)" strokeWidth={Math.max(0.3, w / 600)} filter={`url(#s${uid})`} />

      <g filter={`url(#r${uid})`}>
        {layout.frame && design.frameMaterialId && (layout.frame.kind === "circle"
          ? <circle cx={0} cy={0} r={layout.frame.r} fill="none" stroke={fill(design.frameMaterialId)} strokeWidth={layout.frame.stroke} />
          : <rect x={layout.frame.x} y={layout.frame.y} width={layout.frame.width} height={layout.frame.height} rx={layout.frame.corner}
              fill="none" stroke={fill(design.frameMaterialId)} strokeWidth={layout.frame.stroke} />)}
        {layout.innerRing && <circle cx={0} cy={0} r={layout.innerRing.r} fill="none" stroke={arcFill} strokeWidth={layout.innerRing.stroke} />}
        {layout.arcs.map((arc) => <path key={arc.position} d={arc.pathData} fill={arcFill} />)}
        {layout.lines.map((line) => {
          const d = linePaths.get(line.index);
          const source = design.lines[line.index];
          return d && source ? <path key={line.index} d={d} fill={fill(source.materialId)} transform={`translate(${line.x} ${line.y}) scale(${line.scale})`} /> : null;
        })}
        {layout.logo && logoUrl && (
          <image href={logoUrl} x={layout.logo.x} y={layout.logo.y} width={layout.logo.width} height={layout.logo.height}
            preserveAspectRatio="xMidYMid meet" filter={`url(#l${uid})`} />
        )}
      </g>

      {layout.holes.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={capR} fill={`url(#cap${uid})`} stroke="rgba(15,23,42,.35)" strokeWidth={Math.max(0.3, capR / 10)} />)}
    </svg>
  );
}
