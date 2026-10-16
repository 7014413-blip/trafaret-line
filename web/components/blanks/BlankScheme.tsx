// Scheme of the chosen blank: the shape in its colour on the square (or rectangle) it is cut
// from, with the size lines the customer pays for: «Ø10 см», «10 см», «20 × 30 см».

import { blankShapePath, drawnSize } from "@/lib/blanks/shape-path";
import { cmText } from "@/lib/format";
import type { BlankColour, BlankShape } from "@/types/blank";

const PAD = 0.2;

export function BlankScheme({ shape, widthMm, heightMm, colour, label }: {
  shape: BlankShape;
  widthMm: number;
  heightMm: number;
  colour: BlankColour;
  label: string;
}) {
  // Drawn in units of the larger side, so small and large blanks fill the frame the same way.
  const unit = Math.max(widthMm, heightMm);
  const w = (widthMm / unit) * 100;
  const h = (heightMm / unit) * 100;
  const pad = 100 * PAD;
  const drawn = drawnSize(shape.aspect, w, h, shape.sizeMode);
  const ox = pad + (w - drawn.w) / 2;
  const oy = pad + (h - drawn.h) / 2;
  const d = blankShapePath(shape.id, drawn.w, drawn.h);
  const fill = colour.shine ? "url(#blank-shine)" : colour.hex;
  const widthText = shape.sizeMode === "diameter" ? `Ø${cmText(widthMm)} см` : `${cmText(widthMm)} см`;
  const lineY = pad + h + 9;
  const lineX = pad + w + 9;
  // A tall one-number shape (arch, drop) is measured along its height, the larger side.
  const tall = shape.sizeMode === "side" && shape.aspect > 1;

  return (
    <svg viewBox={`0 0 ${w + 2 * pad} ${h + 2 * pad}`} role="img" aria-label={label} className="block h-auto max-h-[440px] w-full">
      <defs>
        <linearGradient id="blank-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colour.hex} />
          <stop offset="0.45" stopColor={colour.shine ?? colour.hex} />
          <stop offset="0.6" stopColor={colour.hex} />
          <stop offset="1" stopColor={colour.shine ?? colour.hex} />
        </linearGradient>
        <marker id="blank-arrow" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0 0 L6 3 L0 6 Z" fill="#64748b" />
        </marker>
      </defs>
      <rect x={pad} y={pad} width={w} height={h} fill="none" stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth={0.4} />
      <path d={d} transform={`translate(${ox} ${oy})`} fill={fill} fillOpacity={colour.id === "clear" ? 0.75 : 1} stroke="#475569" strokeWidth={0.6} />
      {!tall && (
        <>
          <line x1={pad} y1={lineY} x2={pad + w} y2={lineY} stroke="#64748b" strokeWidth={0.5} markerStart="url(#blank-arrow)" markerEnd="url(#blank-arrow)" />
          <text x={pad + w / 2} y={lineY + 7} textAnchor="middle" fontSize={6} fill="#0f172a">{widthText}</text>
        </>
      )}
      {(shape.sizeMode === "box" || tall) && (
        <>
          <line x1={lineX} y1={pad} x2={lineX} y2={pad + h} stroke="#64748b" strokeWidth={0.5} markerStart="url(#blank-arrow)" markerEnd="url(#blank-arrow)" />
          <text x={lineX + 3} y={pad + h / 2} fontSize={6} fill="#0f172a" dominantBaseline="middle">{cmText(heightMm)} см</text>
        </>
      )}
    </svg>
  );
}
