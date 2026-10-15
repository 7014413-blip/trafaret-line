// Small SVG of a «Написи на планці» set for the cart and checkout: every piece (letters and the
// strip under them) in the sheet colour. Coordinates in mm (viewBox).

import type { JoinedWordsLayout } from "../../types/joined-words";

const f = (v: number) => v.toFixed(1);

export function joinedWordsThumbnailSvg(layout: JoinedWordsLayout, paths: Map<string, string>, colour: string): string {
  const pad = Math.max(2, layout.widthMm / 40);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-pad)} ${f(-pad)} ${f(layout.widthMm + 2 * pad)} ${f(layout.heightMm + 2 * pad)}" preserveAspectRatio="xMidYMid meet">`,
    `<g fill="${colour}" stroke="#334155" stroke-width="${f(Math.max(0.2, layout.widthMm / 800))}">`,
  ];
  for (const p of layout.pieces) {
    parts.push(`<rect x="${f(p.bar.x)}" y="${f(p.bar.y)}" width="${f(p.bar.width)}" height="${f(p.bar.height)}"/>`);
    const d = paths.get(`${p.lineIndex}|${p.part}`);
    if (d) parts.push(`<path d="${d}" transform="translate(${f(p.textX)} ${f(p.textY)}) scale(${p.scale.toFixed(4)})"/>`);
  }
  parts.push("</g></svg>");
  return parts.join("");
}
