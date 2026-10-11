"use client";

// Live preview of self-adhesive letters. «На коробці»: the letters glued on a card box lid, in the
// sheet colour, with a small shadow from their 3 mm thickness; mirror sheets get a light gradient,
// light sheets sit on a darker lid so they stay visible. «Трафарет»: the cardboard stencil that
// comes with the set, the letter shapes cut out of it, as the customer lays it on the box to glue
// the letters straight. A 10 cm ruler under the set shows the real size.

import { useId } from "react";
import type { JoinedWordsMaterial } from "@/types/joined-words";
import type { StickLettersLayout } from "@/types/stick-letters";

export type StickLettersView = "box" | "stencil";

/** Light sheets (white, clear, milky) need a darker surface. */
function isLight(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.75;
}

export function StickLettersPreview({ layout, paths, sheet, view, label }: {
  layout: StickLettersLayout;
  /** Letter outlines by line index, in layout units. */
  paths: Map<number, string>;
  sheet: JoinedWordsMaterial;
  view: StickLettersView;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const w = Math.max(layout.widthMm, 60);
  const h = Math.max(layout.heightMm, 20);
  const padX = Math.max(w * 0.08, 20);
  const padY = Math.max(h * 0.2, 24);
  const ruler = 100;
  const rulerGap = Math.max(12, h * 0.16);
  const total = h + Math.max(0, layout.stencil.y + layout.stencil.height - h) + rulerGap + 14;
  const light = isLight(sheet.hex);
  const fill = sheet.mirror ? `url(#m${uid})` : sheet.hex;
  const cap = layout.lines[0]?.capMm ?? 30;
  const shadow = Math.max(0.3, Math.min(2.5, cap * 0.035));
  const ink = view === "box" && light ? "#e2e8f0" : "#475569";
  // The stencil reaches past the letters by its margin; the ruler goes under it.
  const below = view === "stencil" ? layout.stencil.y + layout.stencil.height - h : 0;
  const surface = view === "stencil" ? "#f4f1ec" : light ? "#9aa1a8" : "#f7f5f1";
  const letters = (paint: string) => layout.lines.map((line) => {
    const d = paths.get(line.index);
    return d ? <path key={line.index} d={d} fill={paint} transform={`translate(${line.x} ${line.y}) scale(${line.scale})`} /> : null;
  });

  return (
    <svg viewBox={`${-padX} ${-padY} ${w + padX * 2} ${total + padY * 2}`} className="block h-auto max-h-[62vh] w-full" role="img" aria-label={label}
      style={{ background: surface }}>
      <defs>
        {sheet.mirror && (
          <linearGradient id={`m${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2={h}>
            <stop offset="0" stopColor={sheet.hex} />
            <stop offset=".3" stopColor="#f8fafc" />
            <stop offset=".5" stopColor={sheet.hex} />
            <stop offset=".75" stopColor="#f8fafc" />
            <stop offset="1" stopColor={sheet.hex} />
          </linearGradient>
        )}
        <filter id={`s${uid}`} x="-5%" y="-10%" width="110%" height="130%">
          <feDropShadow dx={shadow * 0.6} dy={shadow} stdDeviation={shadow * 0.7} floodColor="#000" floodOpacity=".38" />
        </filter>
        <filter id={`c${uid}`} x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="0" dy={Math.max(0.6, h * 0.01)} stdDeviation={Math.max(0.8, h * 0.015)} floodColor="#000" floodOpacity=".25" />
        </filter>
        <pattern id={`k${uid}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#c9a77c" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="#bf9c70" strokeWidth="1.2" />
        </pattern>
        <mask id={`h${uid}`}>
          <rect x={layout.stencil.x} y={layout.stencil.y} width={layout.stencil.width} height={layout.stencil.height} fill="#fff" />
          {letters("#000")}
        </mask>
      </defs>

      {view === "stencil" ? (
        <g filter={`url(#c${uid})`}>
          <rect x={layout.stencil.x} y={layout.stencil.y} width={layout.stencil.width} height={layout.stencil.height}
            rx={Math.min(4, layout.stencil.height * 0.03)} fill={`url(#k${uid})`} mask={`url(#h${uid})`} />
        </g>
      ) : (
        <g filter={`url(#s${uid})`} stroke={sheet.id === "clear" ? "rgba(15,23,42,.35)" : "none"} strokeWidth={Math.max(0.2, w / 1500)}>
          {letters(fill)}
        </g>
      )}

      <g transform={`translate(0 ${h + below + rulerGap})`} fill={ink} stroke={ink}>
        <line x1="0" y1="0" x2={ruler} y2="0" strokeWidth={Math.max(0.4, w / 600)} />
        <line x1="0" y1="-3" x2="0" y2="3" strokeWidth={Math.max(0.4, w / 600)} />
        <line x1={ruler} y1="-3" x2={ruler} y2="3" strokeWidth={Math.max(0.4, w / 600)} />
        <text x={ruler / 2} y="12" textAnchor="middle" fontSize={Math.max(8, w / 60)} stroke="none">10 см</text>
      </g>
    </svg>
  );
}
