// Small SVG of wedding initials for the cart and checkout. Coordinates in mm (viewBox).

import type { InitialsLayout } from "../../types/initials";

const f = (v: number) => v.toFixed(1);

export function initialsThumbnailSvg(layout: InitialsLayout, paths: Map<string, string>, colour: string): string {
  const pad = Math.max(2, layout.widthMm / 20);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(-pad)} ${f(-pad)} ${f(layout.widthMm + 2 * pad)} ${f(layout.heightMm + 2 * pad)}" preserveAspectRatio="xMidYMid meet">`,
    `<g fill="${colour}" stroke="#334155" stroke-width="${f(Math.max(0.2, layout.widthMm / 600))}">`,
  ];
  for (const s of layout.shapes) {
    if (s.type === "text") { const d = paths.get(s.key); if (d) parts.push(`<path d="${d}" transform="translate(${f(s.x)} ${f(s.y)}) scale(${s.scale.toFixed(4)})"/>`); }
    else if (s.type === "rect") parts.push(`<rect x="${f(s.x)}" y="${f(s.y)}" width="${f(s.width)}" height="${f(s.height)}"/>`);
    else if (s.type === "circle") parts.push(`<circle cx="${f(s.cx)}" cy="${f(s.cy)}" r="${f(s.r)}"/>`);
    else parts.push(`<polygon points="${s.points.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}"/>`);
  }
  parts.push("</g></svg>");
  return parts.join("");
}
