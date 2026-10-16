// One master layout → the regions to cut out of a sheet. The SVG is scaled to fit the picture
// box (keeping its proportions) and centred on the sheet, rendered at up to 10 pixels per mm,
// traced along the half-grey level (shared/lib/geometry/trace-raster.ts) and simplified to
// 0.05 mm, so curves stay smooth and the file stays light for the machine.

import { FillRule, simplify, union } from "../../shared/lib/geometry/clipper";
import { DEFAULT_LASER } from "../../shared/lib/geometry/laser-config";
import { traceRaster } from "../../shared/lib/geometry/trace-raster";
import type { Vec2 } from "../../shared/types/geometry";
import type { MasterPiece } from "../../types/masters";
import { renderMasterDarkness } from "./render-master";

/** Finest raster, pixels per mm, and the largest raster side, pixels. */
const MAX_PX_PER_MM = 10;
const MAX_SIDE_PX = 8000;
const SIMPLIFY_MM = 0.05;
/** Specks smaller than this are raster noise, not parts of the picture, mm². */
const MIN_REGION_MM2 = 0.2;

const area = (p: ReadonlyArray<Vec2>) =>
  Math.abs(p.reduce((s, [x, y], i) => { const [nx, ny] = p[(i + 1) % p.length]; return s + x * ny - nx * y; }, 0) / 2);

function viewBoxOf(svg: string): { w: number; h: number } {
  const root = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? "";
  const box = /viewBox\s*=\s*["']\s*([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)/.exec(root);
  if (box) return { w: Number(box[3]), h: Number(box[4]) };
  const w = Number(/\swidth\s*=\s*["']([\d.]+)/.exec(root)?.[1]);
  const h = Number(/\sheight\s*=\s*["']([\d.]+)/.exec(root)?.[1]);
  if (w > 0 && h > 0) return { w, h };
  throw new Error("master layout has no viewBox or size");
}

export function masterToCut(svg: string, sheet: { widthMm: number; heightMm: number }, box: { widthMm: number; heightMm: number }): MasterPiece {
  const view = viewBoxOf(svg);
  if (!(view.w > 0 && view.h > 0)) throw new Error("master layout has an empty viewBox");
  const scale = Math.min(box.widthMm / view.w, box.heightMm / view.h);
  const designW = view.w * scale;
  const designH = view.h * scale;
  const pxPerMm = Math.min(MAX_PX_PER_MM, MAX_SIDE_PX / Math.max(designW, designH));
  const raster = renderMasterDarkness(svg, designW * pxPerMm);
  const contours = traceRaster(raster.values, raster.width, raster.height);

  // Pixels → sheet mm, the picture centred on the sheet.
  const mmPerPxX = designW / raster.width;
  const mmPerPxY = designH / raster.height;
  const offsetX = (sheet.widthMm - designW) / 2;
  const offsetY = (sheet.heightMm - designH) / 2;
  const inMm = contours.map((c) => c.map(([x, y]) => [offsetX + x * mmPerPxX, offsetY + y * mmPerPxY] as Vec2));
  const scaleClipper = DEFAULT_LASER.clipperScale;
  const regions = union(simplify(inMm, SIMPLIFY_MM, scaleClipper), scaleClipper, FillRule.EvenOdd)
    .filter((p) => p.length >= 3 && area(p) >= MIN_REGION_MM2);
  return { cutPaths: regions, designWidthMm: designW, designHeightMm: designH };
}
