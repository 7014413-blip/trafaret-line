// Polygons → SVG path data for previews, Fabric.js objects and the cut file.

import type { Polygon } from "../../types/geometry";

/** "M x y L x y … Z" for every polygon; precision = decimals kept (mm). */
export function polygonsToPathData(polygons: ReadonlyArray<Polygon>, precision = 2): string {
  const parts: string[] = [];
  for (const polygon of polygons) {
    if (polygon.length < 3) continue;
    const points = polygon.map(([x, y]) => `${x.toFixed(precision)} ${y.toFixed(precision)}`);
    parts.push(`M${points.join("L")}Z`);
  }
  return parts.join("");
}

/** Standalone SVG document in millimetres (cut file preview, saved layouts). */
export function polygonsToSvg(polygons: ReadonlyArray<Polygon>, widthMm: number, heightMm: number, options: { fill?: string; stroke?: string } = {}): string {
  const fill = options.fill ?? "none";
  const stroke = options.stroke ?? "#000";
  const d = polygonsToPathData(polygons, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 ${widthMm} ${heightMm}">`
    + `<path d="${d}" fill="${fill}" fill-rule="nonzero" stroke="${stroke}" stroke-width="0.1"/></svg>`;
}
