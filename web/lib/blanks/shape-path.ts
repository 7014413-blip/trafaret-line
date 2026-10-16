// Outline of a blank shape for the scheme and the cart picture: an SVG path in a box of the
// given width and height, mm or any unit. Only for drawing; the price uses the sheet size.

import type { BlankShapeId, BlankSizeMode } from "../../types/blank";

const f = (n: number) => String(Math.round(n * 100) / 100);

function ellipse(w: number, h: number): string {
  const rx = w / 2;
  const ry = h / 2;
  return `M0 ${f(ry)} A${f(rx)} ${f(ry)} 0 1 0 ${f(w)} ${f(ry)} A${f(rx)} ${f(ry)} 0 1 0 0 ${f(ry)} Z`;
}

function roundedRect(w: number, h: number, r: number): string {
  return `M${f(r)} 0 H${f(w - r)} A${f(r)} ${f(r)} 0 0 1 ${f(w)} ${f(r)} V${f(h - r)} A${f(r)} ${f(r)} 0 0 1 ${f(w - r)} ${f(h)}`
    + ` H${f(r)} A${f(r)} ${f(r)} 0 0 1 0 ${f(h - r)} V${f(r)} A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0 Z`;
}

/** Path drawn in a 100-wide unit box of the given height, scaled to w × h. */
function scaled(d: string, unitHeight: number, w: number, h: number): string {
  const sx = w / 100;
  const sy = h / unitHeight;
  let axis = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => f(Number(n) * (axis++ % 2 === 0 ? sx : sy)));
}

function polygon(points: Array<[number, number]>): string {
  return `${points.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join(" ")} Z`;
}

function star(w: number, h: number): string {
  const outer = 1;
  const inner = 0.382;
  const raw: Array<[number, number]> = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    return [Math.cos(angle) * r, Math.sin(angle) * r];
  });
  const xs = raw.map((p) => p[0]);
  const ys = raw.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;
  return polygon(raw.map(([x, y]) => [((x - minX) / spanX) * w, ((y - minY) / spanY) * h]));
}

function scallops(w: number, h: number, count = 16): string {
  const cx = w / 2;
  const cy = h / 2;
  const point = (angle: number, k: number): [number, number] => [cx + Math.cos(angle) * (w / 2) * k, cy + Math.sin(angle) * (h / 2) * k];
  const step = (2 * Math.PI) / count;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = i * step;
    const [x0, y0] = point(a, 0.9);
    const [qx, qy] = point(a + step / 2, 1.1);
    const [x1, y1] = point(a + step, 0.9);
    if (i === 0) parts.push(`M${f(x0)} ${f(y0)}`);
    parts.push(`Q${f(qx)} ${f(qy)} ${f(x1)} ${f(y1)}`);
  }
  return `${parts.join(" ")} Z`;
}

const HEART = "M50 88 C22 68 2 50 2 28 C2 13 13 2 27 2 C38 2 46 9 50 18 C54 9 62 2 73 2 C87 2 98 13 98 28 C98 50 78 68 50 88 Z";
const CLOUD = "M22 65 C10 65 0 56 0 44 C0 32 10 23 22 23 C25 10 37 0 51 0 C65 0 76 9 79 22 C91 23 100 32 100 43 C100 55 91 65 79 65 Z";
const ARCH = "M0 125 L0 50 C0 22 22 0 50 0 C78 0 100 22 100 50 L100 125 Z";
const DROP = "M50 0 C66 30 100 58 100 80 C100 108 78 130 50 130 C22 130 0 108 0 80 C0 58 34 30 50 0 Z";

export function blankShapePath(shapeId: BlankShapeId, w: number, h: number): string {
  switch (shapeId) {
    case "circle":
    case "oval":
      return ellipse(w, h);
    case "square":
    case "rect":
      return roundedRect(w, h, 0);
    case "rounded-square":
      return roundedRect(w, h, Math.min(w, h) * 0.14);
    case "heart":
      return scaled(HEART, 90, w, h);
    case "hexagon":
      return polygon([[w * 0.25, 0], [w * 0.75, 0], [w, h / 2], [w * 0.75, h], [w * 0.25, h], [0, h / 2]]);
    case "star":
      return star(w, h);
    case "cloud":
      return scaled(CLOUD, 65, w, h);
    case "arch":
      return scaled(ARCH, 125, w, h);
    case "drop":
      return scaled(DROP, 130, w, h);
    case "wavy-circle":
      return scallops(w, h);
  }
}

/** Width and height the shape is drawn with inside a sheet: the larger side fills it. */
export function drawnSize(aspect: number, sheetW: number, sheetH: number, sizeMode: BlankSizeMode): { w: number; h: number } {
  if (sizeMode === "box") return { w: sheetW, h: sheetH };
  return aspect >= 1 ? { w: sheetW / aspect, h: sheetH } : { w: sheetW, h: sheetH * aspect };
}
