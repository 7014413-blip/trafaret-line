// Production files for the laser (RDWorks / Ruida, LightBurn): one SVG and one DXF per
// order line, layers separated by colour, because RDWorks assigns cut settings
// (speed, power) per colour layer. Built on the server after payment only; the client
// never receives these files before paying (only a watermarked PNG/PDF preview).
//
// Layers (Денис, 2026-10-08), colours = AutoCAD Color Index in DXF, RGB in SVG:
//   CUT_INNER  blue  (ACI 5)  design contours (letters, pattern) with bridge gaps
//   CUT_OUTER  red   (ACI 1)  outer shape of the sheet, cut last so the part does not move
//   MARKS      green (ACI 3)  holes (hanging / mounting) and alignment marks
//   TEMPLATE   black (ACI 7)  positioning template, reserved (not used for stencils yet)
// Cut order on the machine: MARKS → CUT_INNER → CUT_OUTER (inside first, outline last).
// Units: mm, Y axis down in SVG, up in DXF (flipped on export).
import type { Bridge, Contour, SheetSize, VectorDesign } from "../types/customizer";

type Pt = readonly [number, number];
type Polyline = { points: Pt[]; closed: boolean };

export type LayerId = "CUT_INNER" | "CUT_OUTER" | "MARKS" | "TEMPLATE";

export const LAYERS: Record<LayerId, { aci: number; rgb: string; order: number }> = {
  MARKS: { aci: 3, rgb: "#00ff00", order: 1 },
  CUT_INNER: { aci: 5, rgb: "#0000ff", order: 2 },
  CUT_OUTER: { aci: 1, rgb: "#ff0000", order: 3 },
  TEMPLATE: { aci: 7, rgb: "#000000", order: 4 },
};

export interface Hole {
  x: number; // centre, mm from the sheet's top-left corner
  y: number;
  diameterMm: number;
}

export interface LayeredPart {
  sheet: SheetSize;
  /** Design already scaled to the sheet and offset by the margin, mm. */
  design: VectorDesign;
  bridges: Bridge[];
  holes?: Hole[];
  /** Order number etc., written into SVG metadata and the DXF header comment. */
  label?: string;
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Outer outline of the sheet as a polyline (circle / oval approximated, ≤ 0.05 mm error). */
export function sheetOutline(s: SheetSize): Polyline {
  if (s.shape === "circle" || s.shape === "oval") {
    const rx = s.widthMm / 2, ry = (s.shape === "circle" ? s.widthMm : s.heightMm) / 2;
    const n = Math.max(48, Math.ceil((Math.PI * 2 * Math.max(rx, ry)) / 2)); // ~2 mm segments
    const points: Pt[] = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [rx + rx * Math.cos(a), ry + ry * Math.sin(a)];
    });
    return { points, closed: true };
  }
  const { widthMm: w, heightMm: h } = s;
  return { points: [[0, 0], [w, 0], [w, h], [0, h]], closed: true };
}

/**
 * Cuts a closed contour open at its bridges: removes `widthMm` of path centred on the
 * point of the contour nearest to each bridge. Returns open polylines (the laser stops
 * at each gap, so the inner island of «О», «А», «8» stays attached).
 */
export function splitAtBridges(c: Contour, bridges: Bridge[]): Polyline[] {
  const pts = c.closed ? [...c.points, c.points[0]] : [...c.points];
  if (!bridges.length || pts.length < 2) return [{ points: [...c.points], closed: c.closed }];

  // cumulative length at each vertex
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + dist(pts[i - 1], pts[i]));
  const total = acc[acc.length - 1];

  // position along the path of the nearest point to each bridge
  const gaps = bridges.map((b) => {
    let best = { d: Infinity, s: 0 };
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], z = pts[i], len = dist(a, z) || 1e-9;
      const t = Math.max(0, Math.min(1, ((b.at[0] - a[0]) * (z[0] - a[0]) + (b.at[1] - a[1]) * (z[1] - a[1])) / (len * len)));
      const p = lerp(a, z, t), d = dist(p, b.at);
      if (d < best.d) best = { d, s: acc[i - 1] + t * len };
    }
    return [best.s - b.widthMm / 2, best.s + b.widthMm / 2] as const;
  }).sort((x, y) => x[0] - y[0]);

  const pointAt = (s: number): Pt => {
    const v = ((s % total) + total) % total;
    let i = 1;
    while (i < acc.length - 1 && acc[i] < v) i++;
    const seg = acc[i] - acc[i - 1] || 1e-9;
    return lerp(pts[i - 1], pts[i], (v - acc[i - 1]) / seg);
  };
  const slice = (from: number, to: number): Pt[] => {
    const out: Pt[] = [pointAt(from)];
    for (let k = 0; k < 2; k++) // walk at most one wrap-around
      for (let i = 1; i < acc.length; i++) {
        const s = acc[i] + k * total;
        if (s > from && s < to) out.push(pts[i]);
      }
    out.push(pointAt(to));
    return out;
  };

  // runs between consecutive gaps; for a closed contour the last run wraps to the first gap
  const runs: Polyline[] = [];
  for (let g = 0; g < gaps.length; g++) {
    const from = gaps[g][1];
    const to = g + 1 < gaps.length ? gaps[g + 1][0] : gaps[0][0] + (c.closed ? total : 0);
    if (to - from > 0.05) runs.push({ points: slice(from, to), closed: false });
  }
  if (!c.closed && gaps[0][0] > 0.05) runs.unshift({ points: slice(0, gaps[0][0]), closed: false });
  return runs;
}

function holePolyline(h: Hole): Polyline {
  const r = h.diameterMm / 2, n = Math.max(24, Math.ceil((Math.PI * h.diameterMm) / 1));
  return { points: Array.from({ length: n }, (_, i) => [h.x + r * Math.cos((i / n) * 2 * Math.PI), h.y + r * Math.sin((i / n) * 2 * Math.PI)] as Pt), closed: true };
}

/** Nearest point on a contour to `p`, and its distance. */
export function nearestOnContour(c: Contour, p: Pt): { at: Pt; d: number } {
  const pts = c.closed ? [...c.points, c.points[0]] : c.points;
  let best = { at: pts[0] as Pt, d: Infinity };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], z = pts[i], len2 = (z[0] - a[0]) ** 2 + (z[1] - a[1]) ** 2 || 1e-9;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (z[0] - a[0]) + (p[1] - a[1]) * (z[1] - a[1])) / len2));
    const q = lerp(a, z, t), d = dist(q, p);
    if (d < best.d) best = { at: q, d };
  }
  return best;
}

/**
 * A bridge crosses the stroke, so it must interrupt BOTH edges: the hole contour
 * (inner loop of «О») and the letter's outer contour opposite it. Bridges from
 * generateBridges() sit on the hole contour; here each one gets its twin on the
 * nearest other contour within `maxStrokeMm`.
 */
export function bridgesWithTwins(design: VectorDesign, bridges: Bridge[], maxStrokeMm = 20): Bridge[] {
  const out = [...bridges];
  for (const b of bridges) {
    let twin: { i: number; at: Pt; d: number } | null = null;
    design.contours.forEach((c, i) => {
      if (i === b.contourIndex) return;
      const n = nearestOnContour(c, b.at);
      if (n.d <= maxStrokeMm && (!twin || n.d < twin.d)) twin = { i, ...n };
    });
    const t = twin as { i: number; at: Pt; d: number } | null;
    if (t && !bridges.some((x) => x.contourIndex === t.i && dist(x.at, t.at) < b.widthMm)) out.push({ contourIndex: t.i, at: t.at, widthMm: b.widthMm });
  }
  return out;
}

/** Polylines per layer for a part, in machine order. */
export function partLayers(part: LayeredPart): Record<LayerId, Polyline[]> {
  const inner: Polyline[] = [];
  const all = bridgesWithTwins(part.design, part.bridges);
  part.design.contours.forEach((c, i) => inner.push(...splitAtBridges(c, all.filter((b) => b.contourIndex === i))));
  return {
    MARKS: (part.holes ?? []).map(holePolyline),
    CUT_INNER: inner,
    CUT_OUTER: [sheetOutline(part.sheet)],
    TEMPLATE: [],
  };
}

/**
 * Holes placed with a safe distance from the edges (Денис: 15–20 mm). Corners for
 * 4 holes, top corners for 2, top centre for 1 (hanging hole on a stencil).
 */
export function holesAtCorners(s: SheetSize, count: 1 | 2 | 4, diameterMm = 5, edgeOffsetMm = 15): Hole[] {
  const o = Math.max(edgeOffsetMm, diameterMm), w = s.widthMm, h = s.heightMm;
  if (count === 1) return [{ x: w / 2, y: o, diameterMm }];
  const top = [{ x: o, y: o, diameterMm }, { x: w - o, y: o, diameterMm }];
  return count === 2 ? top : [...top, { x: o, y: h - o, diameterMm }, { x: w - o, y: h - o, diameterMm }];
}

/* ------------------------------------------------------------------ */
/* SVG                                                                 */
/* ------------------------------------------------------------------ */

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Hairline SVG in mm, one <g> per layer, stroke = layer colour, no fill. */
export function toLayeredSvg(part: LayeredPart): string {
  const { widthMm: w, heightMm: h } = part.sheet;
  const layers = partLayers(part);
  const groups = (Object.keys(LAYERS) as LayerId[])
    .sort((a, b) => LAYERS[a].order - LAYERS[b].order)
    .filter((id) => layers[id].length)
    .map((id) => {
      const paths = layers[id].map((p) => `<path d="M${p.points.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}${p.closed ? "Z" : ""}"/>`).join("");
      return `<g id="${id}" stroke="${LAYERS[id].rgb}" fill="none" stroke-width="0.01">${paths}</g>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}mm" height="${f(h)}mm" viewBox="0 0 ${f(w)} ${f(h)}">${part.label ? `<title>${esc(part.label)}</title>` : ""}${groups.join("")}</svg>\n`;
}

/* ------------------------------------------------------------------ */
/* DXF (R12 ASCII: opens in RDWorks, LightBurn, CorelDRAW, AutoCAD)    */
/* ------------------------------------------------------------------ */

/** DXF R12 with LAYER table and POLYLINE entities, units mm, Y flipped to point up. */
export function toLayeredDxf(part: LayeredPart): string {
  const h = part.sheet.heightMm;
  const layers = partLayers(part);
  const ids = (Object.keys(LAYERS) as LayerId[]).sort((a, b) => LAYERS[a].order - LAYERS[b].order);
  const out: string[] = [];
  const g = (code: number, value: string | number) => out.push(String(code), typeof value === "number" ? f(value) : value);

  if (part.label) g(999, part.label.replace(/[\r\n]/g, " "));
  g(0, "SECTION"); g(2, "HEADER"); g(9, "$INSUNITS"); g(70, "4"); g(0, "ENDSEC"); // 4 = millimetres
  g(0, "SECTION"); g(2, "TABLES"); g(0, "TABLE"); g(2, "LAYER"); g(70, String(ids.length));
  for (const id of ids) { g(0, "LAYER"); g(2, id); g(70, "0"); g(62, String(LAYERS[id].aci)); g(6, "CONTINUOUS"); }
  g(0, "ENDTAB"); g(0, "ENDSEC");
  g(0, "SECTION"); g(2, "ENTITIES");
  for (const id of ids)
    for (const p of layers[id]) {
      g(0, "POLYLINE"); g(8, id); g(62, String(LAYERS[id].aci)); g(66, "1"); g(70, p.closed ? "1" : "0");
      for (const [x, y] of p.points) { g(0, "VERTEX"); g(8, id); g(10, x); g(20, h - y); }
      g(0, "SEQEND"); g(8, id);
    }
  g(0, "ENDSEC"); g(0, "EOF");
  return out.join("\n") + "\n";
}
