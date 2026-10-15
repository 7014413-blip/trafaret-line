"use client";

// Live preview of a «Написи на планці» set on a wall: every piece (letters and the strip under
// them) in the sheet colour with a soft shadow, rows as they would hang. Mirror sheets get one
// light gradient across the set; light sheets are shown on a dark wall so they stay visible.
// A 10 cm ruler under the set shows the real size.

import { useId } from "react";
import { PreviewRuler } from "@/components/signage/PreviewRuler";
import { PreviewSvg } from "@/components/signage/PreviewSvg";
import { WallMirrorGradient } from "@/components/signage/WallMirrorGradient";
import { isLightColour } from "@/lib/client/is-light-colour";
import type { JoinedWordsLayout, JoinedWordsMaterial } from "@/types/joined-words";

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
  const darkWall = isLightColour(sheet.hex);
  const fill = sheet.mirror ? `url(#m${uid})` : sheet.hex;
  const shadow = Math.max(0.4, Math.min(3, layout.pieces[0]?.capMm ?? 30) * 0.03);
  const total = h + rulerGap + 14;

  return (
    <PreviewSvg viewBox={[-pad, -pad, w + pad * 2, total + pad * 2]} label={label} style={{ background: darkWall ? "#3b4048" : "#ece9e3" }}>
      <defs>
        {sheet.mirror && <WallMirrorGradient id={`m${uid}`} hex={sheet.hex} width={w} height={h} />}
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
      <PreviewRuler y={h + rulerGap} lengthMm={ruler} ink={darkWall ? "#e2e8f0" : "#475569"} stroke={Math.max(0.4, w / 600)} tick={3} fontSize={Math.max(8, w / 60)} textY={12} />
    </PreviewSvg>
  );
}
