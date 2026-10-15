// Small SVG of a set of self-adhesive letters for the cart and checkout: the letters of every line
// in the sheet colour on a light card. Coordinates in mm (viewBox).

import type { StickLettersLayout } from "../../types/stick-letters";

const f = (v: number) => v.toFixed(1);

export function stickLettersThumbnailSvg(layout: StickLettersLayout, paths: Map<number, string>, colour: string): string {
  const pad = Math.max(3, layout.widthMm / 20);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-pad)} ${f(-pad)} ${f(layout.widthMm + 2 * pad)} ${f(layout.heightMm + 2 * pad)}" preserveAspectRatio="xMidYMid meet">`,
    `<rect x="${f(-pad)}" y="${f(-pad)}" width="${f(layout.widthMm + 2 * pad)}" height="${f(layout.heightMm + 2 * pad)}" fill="#f7f5f1"/>`,
    `<g fill="${colour}" stroke="#334155" stroke-width="${f(Math.max(0.2, layout.widthMm / 800))}">`,
  ];
  for (const line of layout.lines) {
    const d = paths.get(line.index);
    if (d) parts.push(`<path d="${d}" transform="translate(${f(line.x)} ${f(line.y)}) scale(${line.scale.toFixed(4)})"/>`);
  }
  parts.push("</g></svg>");
  return parts.join("");
}
