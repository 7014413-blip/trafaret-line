// Welded letters: a word cut as ONE piece of material (cake toppers, acrylic words).
//
// Rules: docs/tz/trebovaniya-peremychki-i-svarka.md §Б.
//  1. Each letter moves to its previous letter (row-by-row gap, so "Г" and "А" meet where
//     they really are closest) until they just touch: overlap = overlapShare × cap height,
//     at most 15 % of the narrower letter, so "rr" stays readable. Punctuation is never
//     eaten: at most 10 % of its own width. Spaces keep the word gap.
//  2. Lines are re-aligned (left / centre / right), then moved together vertically until
//     they touch, with 1–2 short vertical connectors where they are closest.
//  3. Dots of і, ї, й, ё get a short vertical connector straight down to the letter.
//  4. Words are joined by a short horizontal connector low in the line (unless a bar is on).
//  5. Optional bar under every line, outline around the word, skewers below.
//  6. Whatever is still loose is joined at the closest points (last resort).

import type { PlacedGlyph, Polygon, TextAlign, Vec2, WeldOptions, WeldResult } from "../../types/geometry";
import { bboxOf, distance, nearestOnPolygon, polygonsNetArea, polygonsPerimeter, signedArea } from "../calculators/geometry";
import { FillRule, inflate, union, unionTree, type TreeNode } from "./clipper";
import { DEFAULT_LASER } from "./laser-config";
import { CONSTRUCTOR_CONFIG as C } from "./config";
import { translatePolygons } from "./transform";

export const DEFAULT_WELD: WeldOptions = {
  overlapShare: C.weldOverlapRatio,
  connectorMm: C.connectorWidthMinMm,
  baseline: { enabled: false, heightMm: 6, overlapMm: 2, extendMm: 4 },
  outline: { enabled: false, offsetMm: C.outlineOffsetMm },
  skewers: { count: 0, widthMm: C.stickWidthMm, lengthMm: C.stickLengthMm, pointed: true },
};

/** x of the leftmost and rightmost edge crossing of polygons at height y, or null. */
export function rowExtent(polygons: ReadonlyArray<Polygon>, y: number): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const polygon of polygons) {
    for (let i = 0; i < polygon.length; i++) {
      const [x1, y1] = polygon[i];
      const [x2, y2] = polygon[(i + 1) % polygon.length];
      if (y1 > y === y2 > y) continue;
      const x = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1);
      if (x < min) min = x;
      if (x > max) max = x;
    }
  }
  return min === Infinity ? null : { min, max };
}

/** y of the lowest and highest edge crossing at x, or null. */
export function columnExtent(polygons: ReadonlyArray<Polygon>, x: number): { min: number; max: number } | null {
  const swapped = polygons.map((p) => p.map(([px, py]) => [py, px] as Vec2));
  return rowExtent(swapped, x);
}

/**
 * Smallest horizontal gap between `left` and `right` outlines (negative = they overlap),
 * measured on rows where both have material. Falls back to bounding boxes.
 */
export function horizontalGap(left: ReadonlyArray<Polygon>, right: ReadonlyArray<Polygon>, rowStep: number): number {
  const a = bboxOf(left);
  const b = bboxOf(right);
  const top = Math.max(a.minY, b.minY);
  const bottom = Math.min(a.maxY, b.maxY);
  let gap = Infinity;
  for (let y = top + rowStep / 2; y < bottom; y += rowStep) {
    const l = rowExtent(left, y);
    const r = rowExtent(right, y);
    if (l && r) gap = Math.min(gap, r.min - l.max);
  }
  return gap === Infinity ? b.minX - a.maxX : gap;
}

/** Punctuation and small signs that must never be squeezed away. */
const PUNCTUATION = /^[.,:;!?'’"«»\-–—()]$/;

function glyphWidth(contours: ReadonlyArray<Polygon>): number {
  const box = bboxOf(contours);
  return box.maxX - box.minX;
}

/** Overlap between two neighbours by §Б.2–3. */
export function neighbourOverlap(prev: PlacedGlyph, next: PlacedGlyph, capMm: number, overlapShare: number): number {
  const wPrev = glyphWidth(prev.contours);
  const wNext = glyphWidth(next.contours);
  // clamp(cap × ratio, at least 1.2 mm, at most 15 % of the narrower letter): ТЗ §4.2 п.3.
  let overlap = Math.min(Math.max(overlapShare * capMm, C.weldOverlapMinMm), C.weldOverlapMaxOfNarrow * Math.min(wPrev, wNext));
  if (PUNCTUATION.test(prev.char)) overlap = Math.min(overlap, C.weldPunctOverlapMax * wPrev);
  if (PUNCTUATION.test(next.char)) overlap = Math.min(overlap, C.weldPunctOverlapMax * wNext);
  return Math.max(0, overlap);
}

/** Moves the letters of every line to their previous letter and re-aligns the lines. */
export function tightenLines(glyphs: PlacedGlyph[], capMm: number, overlapShare: number, align: TextAlign): PlacedGlyph[] {
  const rowStep = Math.max(0.1, capMm / 60);
  const lines = new Map<number, PlacedGlyph[]>();
  for (const glyph of glyphs) {
    const list = lines.get(glyph.line) ?? [];
    list.push({ ...glyph, contours: glyph.contours.map((c) => [...c]) });
    lines.set(glyph.line, list);
  }

  const result: PlacedGlyph[] = [];
  const widths: { line: number; minX: number; maxX: number }[] = [];
  for (const [line, list] of [...lines.entries()].sort((x, y) => x[0] - y[0])) {
    // Letters of the current word already placed. A letter is checked against the previous
    // C.weldLookback letters: it may overlap only its direct neighbour and must not reach the
    // ones before, so a slanted "1" after a dot cannot slide over the "0" and hide the dot.
    let word: PlacedGlyph[] = [];
    for (let i = 0; i < list.length; i++) {
      const glyph = list[i];
      if (!glyph.contours.length) {
        word = [];
        continue;
      }
      if (word.length) {
        const recent = word.slice(-Math.max(1, C.weldLookback));
        const shift = Math.max(...recent.map((p, k) => {
          const allowance = k === recent.length - 1 ? neighbourOverlap(p, glyph, capMm, overlapShare) : 0;
          return -(horizontalGap(p.contours, glyph.contours, rowStep) + allowance);
        }));
        for (let j = i; j < list.length; j++) list[j] = { ...list[j], contours: translatePolygons(list[j].contours, shift, 0) };
      }
      word.push(list[i]);
    }
    if (list.some((g) => g.contours.length)) {
      const box = bboxOf(list.flatMap((g) => g.contours));
      widths.push({ line, minX: box.minX, maxX: box.maxX });
    }
    result.push(...list);
  }

  if (!widths.length) return result;
  const widest = Math.max(...widths.map((w) => w.maxX - w.minX));
  const left = Math.min(...widths.map((w) => w.minX));
  return result.map((glyph) => {
    const w = widths.find((x) => x.line === glyph.line);
    if (!w) return glyph;
    const width = w.maxX - w.minX;
    const target = align === "left" ? left : align === "right" ? left + widest - width : left + (widest - width) / 2;
    return { ...glyph, contours: translatePolygons(glyph.contours, target - w.minX, 0) };
  });
}

/** Columns where both outlines have material: bottom of `upper` and top of `lower` at each x. */
function verticalPairs(upper: ReadonlyArray<Polygon>, lower: ReadonlyArray<Polygon>, step: number): { x: number; bottom: number; top: number }[] {
  const a = bboxOf(upper);
  const b = bboxOf(lower);
  const from = Math.max(a.minX, b.minX);
  const to = Math.min(a.maxX, b.maxX);
  const out: { x: number; bottom: number; top: number }[] = [];
  for (let x = from + step / 2; x < to; x += step) {
    const u = columnExtent(upper, x);
    const l = columnExtent(lower, x);
    if (u && l) out.push({ x, bottom: u.max, top: l.min });
  }
  return out;
}

/** Moves every line up until it touches the lines above (§Б.6). */
export function stackLines(glyphs: PlacedGlyph[], capMm: number, overlapShare: number): PlacedGlyph[] {
  const lineIds = [...new Set(glyphs.map((g) => g.line))].sort((a, b) => a - b);
  let result = glyphs.map((g) => ({ ...g }));
  const step = Math.max(0.2, capMm / 40);
  for (const line of lineIds.slice(1)) {
    const upper = result.filter((g) => g.line < line).flatMap((g) => g.contours);
    const lower = result.filter((g) => g.line === line).flatMap((g) => g.contours);
    if (!upper.length || !lower.length) continue;
    const pairs = verticalPairs(upper, lower, step);
    if (!pairs.length) continue;
    const gap = Math.min(...pairs.map((p) => p.top - p.bottom));
    const dy = -(gap + overlapShare * capMm);
    result = result.map((g) => (g.line === line ? { ...g, baselineY: g.baselineY + dy, contours: translatePolygons(g.contours, 0, dy) } : g));
  }
  return result;
}
/**
 * Added parts (connectors, bars, skewers) must wind like the outer contours Clipper
 * returns (positive area), otherwise a NonZero union cancels the overlap into a hole.
 */
export function asOuter(polygon: Vec2[]): Vec2[] {
  return signedArea(polygon) < 0 ? [...polygon].reverse() : polygon;
}

function rect(x1: number, y1: number, x2: number, y2: number): Vec2[] {
  return asOuter([[x1, y1], [x2, y1], [x2, y2], [x1, y2]]);
}

/** Bars under every line, from the baseline down. */
export function baselineBars(glyphs: PlacedGlyph[], options: WeldOptions["baseline"]): Vec2[][] {
  const bars: Vec2[][] = [];
  const lines = new Set(glyphs.map((g) => g.line));
  for (const line of lines) {
    const inLine = glyphs.filter((g) => g.line === line && g.contours.length);
    if (!inLine.length) continue;
    const box = bboxOf(inLine.flatMap((g) => g.contours));
    const baseline = inLine[0].baselineY;
    bars.push(rect(box.minX - options.extendMm, baseline - options.overlapMm, box.maxX + options.extendMm, baseline + options.heightMm));
  }
  return bars;
}

/** Top-level pieces of a union with their holes. */
export function piecesOf(roots: TreeNode[]): { outer: Vec2[]; all: Vec2[][] }[] {
  const out: { outer: Vec2[]; all: Vec2[][] }[] = [];
  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      out.push({ outer: node.polygon, all: [node.polygon, ...node.children.map((c) => c.polygon)] });
      for (const hole of node.children) walk(hole.children);
    }
  };
  walk(roots);
  return out;
}

/** Closest pair of points between two outlines (sampled on `a`). */
function closestPair(a: Polygon, b: Polygon): { from: Vec2; to: Vec2; length: number } {
  let best = { from: a[0], to: b[0], length: Infinity };
  const step = Math.max(1, Math.floor(a.length / 300));
  for (let i = 0; i < a.length; i += step) {
    const near = nearestOnPolygon(a[i], b);
    if (near.distance < best.length) best = { from: a[i], to: near.point, length: near.distance };
  }
  return best;
}

/** Connector rectangle between two points, `width` wide, reaching `reach` mm into both parts. */
function connector(from: Vec2, to: Vec2, width: number, reach: number): Vec2[] {
  const length = distance(from, to);
  const ux = length > 0 ? (to[0] - from[0]) / length : 0;
  const uy = length > 0 ? (to[1] - from[1]) / length : 1;
  const nx = -uy * (width / 2);
  const ny = ux * (width / 2);
  const a: Vec2 = [from[0] - ux * reach, from[1] - uy * reach];
  const b: Vec2 = [to[0] + ux * reach, to[1] + uy * reach];
  return asOuter([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]);
}

/** Joins every loose piece to the biggest one until the shape is one piece. */
export function joinPieces(shape: Vec2[][], connectorMm: number, scale: number): Vec2[][] {
  let current = shape;
  let previousCount = Infinity;
  for (let pass = 0; pass < 200; pass++) {
    const pieces = piecesOf(unionTree(current, scale));
    // Done, or a connector did not merge anything (the caller reports the loose pieces).
    if (pieces.length <= 1 || pieces.length >= previousCount) return current;
    previousCount = pieces.length;
    const ranked = pieces
      .map((piece) => ({ piece, area: Math.abs(signedArea(piece.outer)) }))
      .sort((a, b) => b.area - a.area);
    const main = ranked[0].piece;
    const loose = ranked[ranked.length - 1].piece;
    const pair = closestPair(loose.outer, main.outer);
    // Straight connector (§Б.7): horizontal or vertical through the middle of the closest pair.
    const dx = Math.abs(pair.to[0] - pair.from[0]);
    const dy = Math.abs(pair.to[1] - pair.from[1]);
    const reach = connectorMm;
    const straight = dx >= dy
      ? rect(Math.min(pair.from[0], pair.to[0]) - reach, (pair.from[1] + pair.to[1]) / 2 - connectorMm / 2, Math.max(pair.from[0], pair.to[0]) + reach, (pair.from[1] + pair.to[1]) / 2 + connectorMm / 2)
      : rect((pair.from[0] + pair.to[0]) / 2 - connectorMm / 2, Math.min(pair.from[1], pair.to[1]) - reach, (pair.from[0] + pair.to[0]) / 2 + connectorMm / 2, Math.max(pair.from[1], pair.to[1]) + reach);
    const merged = union([...current, straight], scale);
    // A straight bar that misses one of the parts falls back to the direct connector.
    current = piecesOf(unionTree(merged, scale)).length < pieces.length
      ? merged
      : union([...current, connector(pair.from, pair.to, connectorMm, connectorMm / 2)], scale);
  }
  return current;
}

/** Skewer polygons hanging below the shape. */
export function skewers(shape: Vec2[][], options: WeldOptions["skewers"]): Vec2[][] {
  if (!options.count) return [];
  const box = bboxOf(shape);
  const width = box.maxX - box.minX;
  const xs = options.count === 1 ? [box.minX + width / 2] : [box.minX + width * 0.3, box.minX + width * 0.7];
  const half = options.widthMm / 2;
  return xs.map((x) => {
    const column = columnExtent(shape, x);
    const bottom = column ? column.max : box.maxY;
    const top = bottom - options.widthMm * 1.5;
    const end = bottom + options.lengthMm;
    if (!options.pointed) return rect(x - half, top, x + half, end);
    return asOuter([[x - half, top], [x + half, top], [x + half, end - options.widthMm], [x, end], [x - half, end - options.widthMm]]);
  });
}

/** Connector width by §Б.7: the option, but at least 12 % of the cap height. */
export function connectorWidth(options: WeldOptions, capMm: number): number {
  return Math.max(options.connectorMm, C.connectorWidthRatio * capMm);
}

/**
 * Dots of і, ї, й, ё (and any small detached part of one letter): a vertical connector
 * from the bottom centre of the dot straight down into the letter (§Б.4).
 */
export function diacriticConnectors(glyph: PlacedGlyph, width: number, scale: number): Vec2[][] {
  const pieces = piecesOf(unionTree(union(glyph.contours, scale, FillRule.EvenOdd), scale));
  if (pieces.length < 2) return [];
  const ranked = pieces.map((p) => ({ p, area: Math.abs(signedArea(p.outer)) })).sort((a, b) => b.area - a.area);
  const body = ranked[0].p.all;
  const out: Vec2[][] = [];
  for (const { p } of ranked.slice(1)) {
    const box = bboxOf([p.outer]);
    const cx = (box.minX + box.maxX) / 2;
    const bodyColumn = columnExtent(body, cx);
    if (!bodyColumn) continue;
    const w = Math.max(1.2, Math.min(width, (box.maxX - box.minX) * C.dotConnectorMaxOfDot));
    const reach = Math.min(w, (box.maxY - box.minY) / 2);
    if (bodyColumn.min >= box.maxY) {
      out.push(rect(cx - w / 2, box.maxY - reach, cx + w / 2, bodyColumn.min + reach));
    } else if (bodyColumn.max <= box.minY) {
      out.push(rect(cx - w / 2, bodyColumn.max - reach, cx + w / 2, box.minY + reach));
    }
  }
  return out;
}

/**
 * Words of one line: a horizontal connector between the last letter of a word and the
 * first letter of the next, at the lowest row where both have material (§Б.5).
 */
export function wordConnectors(glyphs: PlacedGlyph[], capMm: number, width: number): Vec2[][] {
  const out: Vec2[][] = [];
  const rowStep = Math.max(0.1, capMm / 60);
  for (const line of new Set(glyphs.map((g) => g.line))) {
    const list = glyphs.filter((g) => g.line === line);
    for (let i = 1; i < list.length; i++) {
      if (list[i].contours.length || !list[i - 1].contours.length) continue;
      const before = list[i - 1];
      const after = list.slice(i + 1).find((g) => g.contours.length);
      if (!after) continue;
      const baseline = before.baselineY;
      for (let y = baseline - 0.12 * capMm; y > baseline - 0.7 * capMm; y -= rowStep) {
        const l = rowExtent(before.contours, y);
        const r = rowExtent(after.contours, y);
        if (!l || !r || r.min <= l.max) continue;
        const reach = Math.min(width, 0.1 * capMm);
        out.push(rect(l.max - reach, y - width / 2, r.min + reach, y + width / 2));
        break;
      }
    }
  }
  return out;
}

/** 1–2 short vertical connectors between neighbouring lines where they are closest (§Б.6). */
export function lineConnectors(glyphs: PlacedGlyph[], capMm: number, width: number): Vec2[][] {
  const out: Vec2[][] = [];
  const lineIds = [...new Set(glyphs.map((g) => g.line))].sort((a, b) => a - b);
  const step = Math.max(0.2, capMm / 40);
  for (let k = 1; k < lineIds.length; k++) {
    const upper = glyphs.filter((g) => g.line === lineIds[k - 1]).flatMap((g) => g.contours);
    const lower = glyphs.filter((g) => g.line === lineIds[k]).flatMap((g) => g.contours);
    if (!upper.length || !lower.length) continue;
    const pairs = verticalPairs(upper, lower, step).filter((p) => p.top - p.bottom <= 0.35 * capMm);
    if (!pairs.length) continue;
    const mid = (pairs[0].x + pairs[pairs.length - 1].x) / 2;
    const halves = [pairs.filter((p) => p.x <= mid), pairs.filter((p) => p.x > mid)];
    for (const half of halves) {
      if (!half.length) continue;
      const best = half.reduce((a, b) => (b.top - b.bottom < a.top - a.bottom ? b : a));
      const reach = Math.min(width, 0.15 * capMm);
      out.push(rect(best.x - width / 2, Math.min(best.bottom, best.top) - reach, best.x + width / 2, Math.max(best.bottom, best.top) + reach));
    }
  }
  return out;
}

/** Full welding pipeline, see the top of the file. Glyph contours are in mm. */
export function weldText(glyphs: PlacedGlyph[], capMm: number, align: TextAlign, options: WeldOptions = DEFAULT_WELD, scale = DEFAULT_LASER.clipperScale): WeldResult {
  const tightened = tightenLines(glyphs, capMm, options.overlapShare, align);
  const stacked = stackLines(tightened, capMm, options.overlapShare);
  const width = connectorWidth(options, capMm);

  const parts: Vec2[][] = [];
  for (const glyph of stacked) {
    if (!glyph.contours.length) continue;
    parts.push(...union(glyph.contours, scale, FillRule.EvenOdd));
    parts.push(...diacriticConnectors(glyph, width, scale));
  }
  if (options.baseline.enabled) parts.push(...baselineBars(stacked, options.baseline));
  else parts.push(...wordConnectors(stacked, capMm, width));
  parts.push(...lineConnectors(stacked, capMm, width));

  let shape = joinPieces(union(parts, scale), width, scale);

  if (options.outline.enabled && options.outline.offsetMm > 0) {
    const grown = inflate(shape, options.outline.offsetMm, scale);
    // Outline = silhouette: keep outer contours only.
    shape = piecesOf(unionTree(grown, scale)).map((piece) => piece.outer);
  }
  // The nesting tree is itself a union, so the skewers are joined in the same pass.
  const roots = unionTree(options.skewers.count ? [...shape, ...skewers(shape, options.skewers)] : shape, scale);
  const pieces = piecesOf(roots);
  const shapes = pieces.flatMap((piece) => piece.all);
  return {
    shapes,
    pieces: pieces.length,
    bbox: bboxOf(shapes),
    areaMm2: polygonsNetArea(shapes),
    cutLengthMm: polygonsPerimeter(shapes),
  };
}