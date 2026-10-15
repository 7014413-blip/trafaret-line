// Small SVG of a two-layer plaque for the cart and checkout: back plate, plate, frame and text
// in their colours. Coordinates in mm (viewBox).

import type { LayeredPlaqueLayout } from "../../types/layered-plaque";

const f = (v: number) => v.toFixed(1);

export function layeredPlaqueThumbnailSvg(layout: LayeredPlaqueLayout, linePaths: Map<number, string>, baseColour: string, overlayColour: string): string {
  const pad = Math.max(2, layout.widthMm / 30);
  const p = layout.plate;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-layout.widthMm / 2 - pad)} ${f(-layout.heightMm / 2 - pad)} ${f(layout.widthMm + 2 * pad)} ${f(layout.heightMm + 2 * pad)}" preserveAspectRatio="xMidYMid meet">`,
  ];
  if (layout.back) parts.push(`<rect x="${f(layout.back.x)}" y="${f(layout.back.y)}" width="${f(layout.back.width)}" height="${f(layout.back.height)}" rx="${f(layout.cornerMm)}" fill="${overlayColour}"/>`);
  parts.push(`<rect x="${f(p.x)}" y="${f(p.y)}" width="${f(p.width)}" height="${f(p.height)}" rx="${f(layout.cornerMm)}" fill="${baseColour}" stroke="#334155" stroke-width="${f(Math.max(0.3, p.width / 300))}"/>`);
  if (layout.frame) {
    const fr = layout.frame;
    parts.push(`<rect x="${f(fr.x)}" y="${f(fr.y)}" width="${f(fr.width)}" height="${f(fr.height)}" rx="${f(fr.corner)}" fill="none" stroke="${overlayColour}" stroke-width="${f(fr.stroke)}"/>`);
  }
  for (const line of layout.lines) {
    const d = linePaths.get(line.index);
    if (d) parts.push(`<path d="${d}" fill="${overlayColour}" transform="translate(${f(line.x)} ${f(line.y)}) scale(${line.scale.toFixed(4)})"/>`);
  }
  parts.push("</svg>");
  return parts.join("");
}
