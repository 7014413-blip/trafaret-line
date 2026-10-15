"use client";

// Live preview of wedding initials on a cake top: the letters, the separator and (as a topper)
// the strip with the skewer, in the sheet colour with a mirror gradient and a soft shadow.
// A 5 cm ruler under the composition shows the real size.

import { useId } from "react";
import { PreviewRuler } from "@/components/signage/PreviewRuler";
import { PreviewSvg } from "@/components/signage/PreviewSvg";
import type { InitialsLayout } from "@/types/initials";
import type { JoinedWordsMaterial } from "@/types/joined-words";

export function InitialsPreview({ layout, paths, sheet, label }: {
  layout: InitialsLayout;
  /** Outlines by part ("first", "second", "sep"), in layout units. */
  paths: Map<string, string>;
  sheet: JoinedWordsMaterial;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const w = Math.max(layout.widthMm, 60);
  const h = Math.max(layout.heightMm, 30);
  const pad = Math.max(w, h) * 0.18;
  const fill = sheet.mirror ? `url(#m${uid})` : sheet.hex;
  const shadow = Math.max(0.5, h * 0.015);
  const ruler = 50;
  const total = h + Math.max(8, h * 0.1) + 12;

  return (
    <PreviewSvg viewBox={[-pad, -pad, w + pad * 2, total + pad * 2]} label={label} style={{ background: "radial-gradient(circle at 50% 45%, #fbf8f2, #ece4d6)" }}>
      <defs>
        {sheet.mirror && (
          <linearGradient id={`m${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2={h}>
            <stop offset="0" stopColor={sheet.hex} />
            <stop offset=".35" stopColor="#fffbea" />
            <stop offset=".55" stopColor={sheet.hex} />
            <stop offset=".8" stopColor="#fffdf3" />
            <stop offset="1" stopColor={sheet.hex} />
          </linearGradient>
        )}
        <filter id={`s${uid}`} x="-10%" y="-10%" width="125%" height="130%">
          <feDropShadow dx={shadow} dy={shadow * 1.4} stdDeviation={shadow} floodColor="#5b4a2f" floodOpacity=".35" />
        </filter>
      </defs>
      <g fill={fill} filter={`url(#s${uid})`} stroke={sheet.id === "clear" ? "rgba(15,23,42,.35)" : "none"} strokeWidth={Math.max(0.2, w / 800)}>
        {layout.shapes.map((s, i) => {
          if (s.type === "text") { const d = paths.get(s.key); return d ? <path key={i} d={d} transform={`translate(${s.x} ${s.y}) scale(${s.scale})`} /> : null; }
          if (s.type === "rect") return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} />;
          if (s.type === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} />;
          return <polygon key={i} points={s.points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")} />;
        })}
      </g>
      <PreviewRuler y={h + Math.max(8, h * 0.1)} lengthMm={ruler} ink="#64748b" stroke={Math.max(0.3, w / 500)} tick={2} fontSize={Math.max(5, w / 40)} textY={9} />
    </PreviewSvg>
  );
}
