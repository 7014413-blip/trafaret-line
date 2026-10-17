// Renders a master layout SVG into a «darkness» raster: 1 where the picture is black (cut out),
// 0 where it is empty or white. resvg draws every SVG feature the masters use (masks, strokes,
// transforms, white shapes over black), so the traced outline is exactly what the picture shows.

import { Resvg } from "@resvg/resvg-js";

/** Largest master accepted, characters. */
const MAX_SVG_CHARS = 25_000_000;

export interface MasterRaster {
  values: Float32Array;
  width: number;
  height: number;
}

export function renderMasterDarkness(svg: string, widthPx: number): MasterRaster {
  if (svg.length > MAX_SVG_CHARS) throw new Error("master layout is too large");
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: Math.round(widthPx) }, font: { loadSystemFonts: false } });
  const image = resvg.render();
  const { width, height, pixels } = image;
  const values = new Float32Array(width * height);
  for (let i = 0; i < values.length; i++) {
    const r = pixels[4 * i], g = pixels[4 * i + 1], b = pixels[4 * i + 2], a = pixels[4 * i + 3];
    if (!a) continue;
    // Pixels are premultiplied: un-premultiply for the luminance, keep alpha as coverage.
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / a;
    values[i] = (a / 255) * (1 - Math.min(1, lum));
  }
  return { values, width, height };
}
