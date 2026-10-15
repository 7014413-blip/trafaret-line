// Small SVG of a pointer sign for the cart and checkout: base in its colour, raised text,
// arrow and logo area in the overlay colour. The logo picture itself stays out of
// localStorage; its area is shown as a soft disc. Coordinates in mm (viewBox).

import type { PointerSignLayout } from "../../types/pointer-sign";

const f = (v: number) => v.toFixed(1);

export function pointerThumbnailSvg(
  layout: PointerSignLayout, linePaths: Map<number, string>, baseColour: string, overlayColour: string,
): string {
  const pad = Math.max(2, layout.widthMm / 40);
  const w = layout.widthMm;
  const h = layout.heightMm;
  const outline = layout.outline.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-w / 2 - pad)} ${f(-h / 2 - pad)} ${f(w + 2 * pad)} ${f(h + 2 * pad)}" preserveAspectRatio="xMidYMid meet">`,
    `<polygon points="${outline}" fill="${baseColour}" stroke="#334155" stroke-width="${f(Math.max(0.4, w / 300))}"/>`,
  ];
  for (const line of layout.lines) {
    const d = linePaths.get(line.index);
    if (d) parts.push(`<path d="${d}" fill="${overlayColour}" transform="translate(${f(line.x)} ${f(line.y)}) scale(${line.scale.toFixed(4)})"/>`);
  }
  if (layout.arrow) parts.push(`<polygon points="${layout.arrow.points.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" fill="${overlayColour}"/>`);
  if (layout.logo) {
    const r = Math.min(layout.logo.boxWidth, layout.logo.boxHeight) / 2;
    parts.push(`<circle cx="${f(layout.logo.cx)}" cy="${f(layout.logo.cy)}" r="${f(r)}" fill="${overlayColour}" opacity=".45"/>`);
    if (layout.logo.ringWidth > 0) {
      parts.push(`<circle cx="${f(layout.logo.cx)}" cy="${f(layout.logo.cy)}" r="${f(layout.logo.ringRadius)}" fill="none" stroke="${overlayColour}" stroke-width="${f(layout.logo.ringWidth)}"/>`);
    }
  }
  parts.push("</svg>");
  return parts.join("");
}
