"use client";

// Live preview of a pointer sign: the base in its sheet colour, the raised overlay (text,
// arrow, logo, ring) with a soft shadow so the second layer reads as volume, like on
// Денис's photos. Mirror sheets get a light gradient. The logo picture is tinted with the
// overlay colour: dark parts of the picture (or light parts when inverted) become the overlay.

import { useId } from "react";
import { PlacedLinePaths } from "@/components/signage/PlacedLinePaths";
import { PreviewSvg } from "@/components/signage/PreviewSvg";
import type { PointerMaterial, PointerSignLayout } from "@/types/pointer-sign";

export interface PointerPreviewLogo {
  url: string;
  invert: boolean;
}

function Fill({ id, sheet }: { id: string; sheet: PointerMaterial }) {
  if (!sheet.mirror) return null;
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#f8fafc" />
      <stop offset=".42" stopColor={sheet.hex} />
      <stop offset=".58" stopColor="#f8fafc" />
      <stop offset="1" stopColor={sheet.hex} />
    </linearGradient>
  );
}

const points = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

export function PointerSignPreview({ layout, linePaths, base, overlay, logo, label }: {
  layout: PointerSignLayout;
  linePaths: Map<number, string>;
  base: PointerMaterial;
  overlay: PointerMaterial;
  logo: PointerPreviewLogo | null;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const w = layout.widthMm;
  const h = layout.heightMm;
  const pad = Math.max(w, h) * 0.07;
  const baseFill = base.mirror ? `url(#b${uid})` : base.hex;
  const overlayFill = overlay.mirror ? `url(#o${uid})` : overlay.hex;
  const shadow = Math.max(0.6, h * 0.012);
  // Alpha from luminance: dark pixels opaque (normal) or light pixels opaque (inverted).
  const alphaRow = logo?.invert ? "0.2126 0.7152 0.0722 1 -1" : "-0.2126 -0.7152 -0.0722 1 0";

  return (
    <PreviewSvg viewBox={[-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2]} label={label}>
      <defs>
        <Fill id={`b${uid}`} sheet={base} />
        <Fill id={`o${uid}`} sheet={overlay} />
        <filter id={`s${uid}`} x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow dx="0" dy={h * 0.02} stdDeviation={h * 0.025} floodOpacity=".28" />
        </filter>
        <filter id={`r${uid}`} x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx={shadow * 0.5} dy={shadow} stdDeviation={shadow * 0.6} floodColor="#000" floodOpacity=".45" />
        </filter>
        {logo && (
          <filter id={`l${uid}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${alphaRow}`} result="a" />
            <feComponentTransfer in="a" result="m"><feFuncA type="linear" slope="2.4" intercept="-0.6" /></feComponentTransfer>
            <feFlood floodColor={overlay.hex} result="c" />
            <feComposite in="c" in2="m" operator="in" />
          </filter>
        )}
      </defs>

      <polygon points={points(layout.outline)} fill={baseFill} stroke="rgba(15,23,42,.25)" strokeWidth={Math.max(0.3, w / 600)} filter={`url(#s${uid})`} />

      <g filter={`url(#r${uid})`}>
        <PlacedLinePaths lines={layout.lines} paths={linePaths} fill={overlayFill} />
        {layout.arrow && <polygon points={points(layout.arrow.points)} fill={overlayFill} />}
        {layout.logo && layout.logo.ringWidth > 0 && (
          <circle cx={layout.logo.cx} cy={layout.logo.cy} r={layout.logo.ringRadius} fill="none" stroke={overlayFill} strokeWidth={layout.logo.ringWidth} />
        )}
        {layout.logo && logo && (
          <image href={logo.url} x={layout.logo.cx - layout.logo.boxWidth / 2} y={layout.logo.cy - layout.logo.boxHeight / 2}
            width={layout.logo.boxWidth} height={layout.logo.boxHeight} preserveAspectRatio="xMidYMid meet" filter={`url(#l${uid})`} />
        )}
      </g>
    </PreviewSvg>
  );
}
