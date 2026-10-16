// Production files for the laser (RDWorks / Ruida, LightBurn): one SVG and one DXF per
// order line, layers separated by colour, because RDWorks assigns cut settings
// (speed, power) per colour layer. Built on the server after payment only; the client
// never receives these files before paying (only a watermarked preview).
//
// Layers (Денис, 2026-10-08), colours = AutoCAD Color Index in DXF, RGB in SVG:
//   CUT_INNER  blue  (ACI 5)  cut regions of the design, bridges already subtracted
//                            (lib/geometry/bridges.ts), so every contour is closed
//   CUT_OUTER  red   (ACI 1)  outer shape of the sheet, cut last so the part does not move
//   MARKS      green (ACI 3)  holes (hanging / mounting) and alignment marks
//   TEMPLATE   black (ACI 7)  positioning template for signs
// Cut order on the machine: MARKS → CUT_INNER → CUT_OUTER (inside first, outline last).
// Units: mm, Y axis down in SVG, up in DXF (flipped on export).

import type { SheetSize } from "../../types/customizer";
import type { Vec2 } from "../../types/geometry";
import type { Hole, LayeredPart, LayerId, LayerStyle, Polyline } from "../../types/vector";

export const LAYERS: Record<LayerId, LayerStyle> = {
  MARKS: { aci: 3, rgb: "#00ff00", order: 1 },
  CUT_INNER: { aci: 5, rgb: "#0000ff", order: 2 },
  CUT_OUTER: { aci: 1, rgb: "#ff0000", order: 3 },
  TEMPLATE: { aci: 7, rgb: "#000000", order: 4 },
};

/** Outer outline of the sheet as a polyline (circle / oval in ~2 mm segments). */
export function sheetOutline(sheet: SheetSize): Polyline {
  if (sheet.shape === "circle" || sheet.shape === "oval") {
    const rx = sheet.widthMm / 2;
    const ry = (sheet.shape === "circle" ? sheet.widthMm : sheet.heightMm) / 2;
    const segments = Math.max(48, Math.ceil((Math.PI * 2 * Math.max(rx, ry)) / 2));
    const points: Vec2[] = Array.from({ length: segments }, (_, i) => {
      const a = (i / segments) * Math.PI * 2;
      return [rx + rx * Math.cos(a), ry + ry * Math.sin(a)] as Vec2;
    });
    return { points, closed: true };
  }
  const { widthMm: w, heightMm: h } = sheet;
  return { points: [[0, 0], [w, 0], [w, h], [0, h]], closed: true };
}

/** Circle of a mounting hole in ~1 mm segments. */
export function holePolyline(hole: Hole): Polyline {
  const r = hole.diameterMm / 2;
  const segments = Math.max(24, Math.ceil(Math.PI * hole.diameterMm));
  return {
    points: Array.from({ length: segments }, (_, i) => {
      const a = (i / segments) * 2 * Math.PI;
      return [hole.x + r * Math.cos(a), hole.y + r * Math.sin(a)] as Vec2;
    }),
    closed: true,
  };
}

/** Polylines per layer for a part. */
export function partLayers(part: LayeredPart): Record<LayerId, Polyline[]> {
  return {
    MARKS: (part.holes ?? []).map(holePolyline),
    CUT_INNER: part.cutPaths.filter((p) => p.length >= 3).map((p) => ({ points: [...p], closed: true })),
    CUT_OUTER: [sheetOutline(part.sheet)],
    TEMPLATE: (part.template ?? []).filter((p) => p.length >= 3).map((p) => ({ points: [...p], closed: true })),
  };
}

/**
 * Holes placed with a safe distance from the edges (Денис: 15–20 mm). Corners for
 * 4 holes, top corners for 2, top centre for 1 (hanging hole on a stencil).
 */
export function holesAtCorners(sheet: SheetSize, count: 1 | 2 | 4, diameterMm = 5, edgeOffsetMm = 15): Hole[] {
  const offset = Math.max(edgeOffsetMm, diameterMm);
  const w = sheet.widthMm;
  const h = sheet.heightMm;
  if (count === 1) return [{ x: w / 2, y: offset, diameterMm }];
  const top = [{ x: offset, y: offset, diameterMm }, { x: w - offset, y: offset, diameterMm }];
  return count === 2 ? top : [...top, { x: offset, y: h - offset, diameterMm }, { x: w - offset, y: h - offset, diameterMm }];
}

const num = (n: number) => (Math.round(n * 1000) / 1000).toString();
const escapeXml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

function orderedLayerIds(): LayerId[] {
  return (Object.keys(LAYERS) as LayerId[]).sort((a, b) => LAYERS[a].order - LAYERS[b].order);
}

/** Hairline SVG in mm, one <g> per layer, stroke = layer colour, no fill. */
export function toLayeredSvg(part: LayeredPart): string {
  const { widthMm: w, heightMm: h } = part.sheet;
  const layers = partLayers(part);
  const groups = orderedLayerIds()
    .filter((id) => layers[id].length)
    .map((id) => {
      const paths = layers[id]
        .map((p) => `<path d="M${p.points.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}${p.closed ? "Z" : ""}"/>`)
        .join("");
      return `<g id="${id}" stroke="${LAYERS[id].rgb}" fill="none" stroke-width="0.01">${paths}</g>`;
    });
  const title = part.label ? `<title>${escapeXml(part.label)}</title>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${num(w)}mm" height="${num(h)}mm" viewBox="0 0 ${num(w)} ${num(h)}">${title}${groups.join("")}</svg>\n`;
}

/** DXF R12 with LAYER table and POLYLINE entities, units mm, Y flipped to point up. */
export function toLayeredDxf(part: LayeredPart): string {
  const h = part.sheet.heightMm;
  const layers = partLayers(part);
  const ids = orderedLayerIds();
  const out: string[] = [];
  const group = (code: number, value: string | number) => out.push(String(code), typeof value === "number" ? num(value) : value);

  if (part.label) group(999, part.label.replace(/[\r\n]/g, " "));
  group(0, "SECTION"); group(2, "HEADER"); group(9, "$INSUNITS"); group(70, "4"); group(0, "ENDSEC"); // 4 = millimetres
  group(0, "SECTION"); group(2, "TABLES"); group(0, "TABLE"); group(2, "LAYER"); group(70, String(ids.length));
  for (const id of ids) {
    group(0, "LAYER"); group(2, id); group(70, "0"); group(62, String(LAYERS[id].aci)); group(6, "CONTINUOUS");
  }
  group(0, "ENDTAB"); group(0, "ENDSEC");
  group(0, "SECTION"); group(2, "ENTITIES");
  for (const id of ids) {
    for (const polyline of layers[id]) {
      group(0, "POLYLINE"); group(8, id); group(62, String(LAYERS[id].aci)); group(66, "1"); group(70, polyline.closed ? "1" : "0");
      for (const [x, y] of polyline.points) {
        group(0, "VERTEX"); group(8, id); group(10, x); group(20, h - y);
      }
      group(0, "SEQEND"); group(8, id);
    }
  }
  group(0, "ENDSEC"); group(0, "EOF");
  return `${out.join("\n")}\n`;
}
