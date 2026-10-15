// Small SVG of an office plaque for the cart and checkout: base, mirror plate, engraved text.
// Coordinates in mm (viewBox), one decimal to keep localStorage small.

import type { OfficePlaqueLayout, PlaqueBaseColour, PlaquePlateColour } from "../../types/office-plaque";

const f = (v: number) => v.toFixed(1);

export function plaqueThumbnailSvg(layout: OfficePlaqueLayout, linePaths: Map<number, string>, base: PlaqueBaseColour, plate: PlaquePlateColour): string {
  const w = layout.widthMm;
  const h = layout.heightMm;
  const pad = Math.max(2, w / 40);
  const p = layout.plate;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-w / 2 - pad)} ${f(-h / 2 - pad)} ${f(w + 2 * pad)} ${f(h + 2 * pad)}" preserveAspectRatio="xMidYMid meet">`,
    `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" fill="${base.hex}" stroke="#334155" stroke-width="${f(Math.max(0.3, w / 300))}"/>`,
    `<rect x="${f(p.x)}" y="${f(p.y)}" width="${f(p.width)}" height="${f(p.height)}" fill="${plate.hex}"/>`,
  ];
  for (const line of layout.lines) {
    const d = linePaths.get(line.index);
    if (d) parts.push(`<path d="${d}" fill="${plate.engraveHex}" transform="translate(${f(line.x)} ${f(line.y)}) scale(${line.scale.toFixed(4)})"/>`);
  }
  parts.push("</svg>");
  return parts.join("");
}
