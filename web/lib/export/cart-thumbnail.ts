// Small SVG previews of constructor items for the cart and checkout (QA 2026-10-10, m1):
// a stencil sheet with its cut-outs, or the solid piece of a welded word. Coordinates stay
// in millimetres (viewBox), precision 0.1 mm keeps the string short for localStorage.

import type { Polygon } from "../../types/geometry";
import { polygonsToPathData } from "../geometry/svg-path";

const PRECISION = 1;

/** Sheet in the material colour with the cut-outs in dark, like the stencil on a table. */
export function stencilThumbnailSvg(widthMm: number, heightMm: number, cutPaths: ReadonlyArray<Polygon>, faceColour: string): string {
  const d = polygonsToPathData(cutPaths, PRECISION);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthMm.toFixed(0)} ${heightMm.toFixed(0)}" preserveAspectRatio="xMidYMid meet">`
    + `<rect width="${widthMm.toFixed(0)}" height="${heightMm.toFixed(0)}" fill="${faceColour}" stroke="#94a3b8" stroke-width="${Math.max(0.5, widthMm / 200).toFixed(1)}"/>`
    + `<path d="${d}" fill="#0f172a" fill-rule="nonzero"/></svg>`;
}

/** Welded word: the piece itself in its colour, with a thin outline so clear acrylic stays visible. */
export function weldThumbnailSvg(widthMm: number, heightMm: number, shapes: ReadonlyArray<Polygon>, colour: string): string {
  const d = polygonsToPathData(shapes, PRECISION);
  const pad = Math.max(2, widthMm / 40);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${(-pad).toFixed(1)} ${(-pad).toFixed(1)} ${(widthMm + 2 * pad).toFixed(1)} ${(heightMm + 2 * pad).toFixed(1)}" preserveAspectRatio="xMidYMid meet">`
    + `<path d="${d}" fill="${colour}" fill-rule="nonzero" stroke="#334155" stroke-width="${Math.max(0.4, widthMm / 300).toFixed(2)}"/></svg>`;
}
