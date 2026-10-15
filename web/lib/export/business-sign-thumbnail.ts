// Small SVG of a business sign for the cart and checkout: base, frame, edge text and text lines in
// their sheet colours. The logo picture stays out of localStorage; its area is a soft rectangle.
// Coordinates in mm (viewBox), origin at the sign centre.

import type { BusinessSignDesign, BusinessSignLayout } from "../../types/business-sign";
import { findBusinessSignSheet } from "../business-sign/palette";

const f = (v: number) => v.toFixed(1);

export function businessSignThumbnailSvg(design: BusinessSignDesign, layout: BusinessSignLayout, linePaths: Map<number, string>): string {
  const w = layout.widthMm;
  const h = layout.heightMm;
  const pad = Math.max(2, Math.max(w, h) / 40);
  const colour = (id: string) => findBusinessSignSheet(id).hex;
  const outline = layout.outline.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-w / 2 - pad)} ${f(-h / 2 - pad)} ${f(w + 2 * pad)} ${f(h + 2 * pad)}" preserveAspectRatio="xMidYMid meet">`,
    `<polygon points="${outline}" fill="${colour(design.baseMaterialId)}" stroke="#334155" stroke-width="${f(Math.max(0.4, w / 300))}"/>`,
  ];
  if (layout.frame && design.frameMaterialId) {
    const stroke = colour(design.frameMaterialId);
    parts.push(layout.frame.kind === "circle"
      ? `<circle cx="0" cy="0" r="${f(layout.frame.r)}" fill="none" stroke="${stroke}" stroke-width="${f(layout.frame.stroke)}"/>`
      : `<rect x="${f(layout.frame.x)}" y="${f(layout.frame.y)}" width="${f(layout.frame.width)}" height="${f(layout.frame.height)}" rx="${f(layout.frame.corner)}" fill="none" stroke="${stroke}" stroke-width="${f(layout.frame.stroke)}"/>`);
  }
  if (design.arc) {
    const arcColour = colour(design.arc.materialId);
    if (layout.innerRing) parts.push(`<circle cx="0" cy="0" r="${f(layout.innerRing.r)}" fill="none" stroke="${arcColour}" stroke-width="${f(layout.innerRing.stroke)}"/>`);
    for (const arc of layout.arcs) parts.push(`<path d="${arc.pathData}" fill="${arcColour}"/>`);
  }
  for (const line of layout.lines) {
    const d = linePaths.get(line.index);
    const source = design.lines[line.index];
    if (d && source) parts.push(`<path d="${d}" fill="${colour(source.materialId)}" transform="translate(${f(line.x)} ${f(line.y)}) scale(${line.scale.toFixed(4)})"/>`);
  }
  if (layout.logo && design.logo) {
    parts.push(`<rect x="${f(layout.logo.x)}" y="${f(layout.logo.y)}" width="${f(layout.logo.width)}" height="${f(layout.logo.height)}" rx="${f(Math.min(layout.logo.width, layout.logo.height) * 0.15)}" fill="${colour(design.logo.materialId)}" opacity=".45"/>`);
  }
  parts.push("</svg>");
  return parts.join("");
}
