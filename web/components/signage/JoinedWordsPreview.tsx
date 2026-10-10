"use client";

// Live preview of a «Написи на планці» set on a wall: every piece (letters and the strip under
// them) in the sheet colour with a soft shadow, rows as they would hang. Mirror sheets get one
// light gradient across the set; light sheets are shown on a dark wall so they stay visible.
// A 10 cm ruler under the set shows the real size.

import { useId } from "react";
import type { JoinedWordsLayout, JoinedWordsMaterial } from "@/types/joined-words";

/** Light sheets (white, clear) need a dark wall. */
function isLight(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.75;
}

export function JoinedWordsPreview({ layout, paths, sheet, label }: {
  layout: JoinedWordsLayout;
  /** Letter outlines by "lineIndex|part", in layout units. */
  paths: Map<string, string>;
  sheet: JoinedWordsMaterial;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const w = Math.max(layout.widthMm, 100);
  const h = Math.max(layout.heightMm, 30);
  const pad = Math.max(w, h) * 0.06;
  const ruler = 100;
  const rulerGap = Math.max(8, h * 0.06);
  const darkWall = isLight(sheet.hex);
  const fill = sheet.mirror ? `url(#m${uid})` : sheet.hex;
  const shadow = Math.max(0.4, Math.min(3, layout.pieces[0]?.capMm ?? 30) * 0.03);
  const total = h + rulerGap + 14;

  return (
    <svg viewBox={`${-pad} ${-pad} ${w + pad * 2} ${total + pad * 2}`} className="block h-auto max-h-[62vh] w-full" role="img" aria-label={label}
      style={{ background: darkWall ? "#3b4048" : "#ece9e3" }}>
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
          <feDropShadow dx={shadow * 0.6} dy={shadow} stdDeviation={shadow * 0.8} floodColor="#000" floodOpacity=".35" />
        </filter>
      </defs>
      <g filter={`url(#s${uid})`} stroke={sheet.id === "clear" ? "rgba(15,23,42,.35)" : "none"} strokeWidth={Math.max(0.2, w / 1500)}>
        {layout.pieces.map((p) => {
          const d = paths.get(`${p.lineIndex}|${p.part}`);
          return (
            <g key={`${p.lineIndex}|${p.part}`} fill={fill}>
              <rect x={p.bar.x} y={p.bar.y} width={p.bar.width} height={p.bar.height} />
              {d && <path d={d} transform={`translate(${p.textX} ${p.textY}) scale(${p.scale})`} />}
            </g>
          );
        })}
      </g>
      <g transform={`translate(0 ${h + rulerGap})`} fill={darkWall ? "#e2e8f0" : "#475569"} stroke={darkWall ? "#e2e8f0" : "#475569"}>
        <line x1="0" y1="0" x2={ruler} y2="0" strokeWidth={Math.max(0.4, w / 600)} />
        <line x1="0" y1="-3" x2="0" y2="3" strokeWidth={Math.max(0.4, w / 600)} />
        <line x1={ruler} y1="-3" x2={ruler} y2="3" strokeWidth={Math.max(0.4, w / 600)} />
        <text x={ruler / 2} y="12" textAnchor="middle" fontSize={Math.max(8, w / 60)} stroke="none">10 см</text>
      </g>
    </svg>
  );
}
