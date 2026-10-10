// Text → outlines for the constructors. Glyph outlines from opentype.js are flattened
// to polylines in a nominal unit (font size 100 → 1 unit), laid out in up to 4 lines,
// aligned, and moved so the bounding box starts at (0, 0). Every glyph keeps its own
// contours (group index), so holes are resolved per letter by the Clipper2 cutter.

import type * as opentype from "opentype.js";
import type { Contour, VectorDesign } from "../../types/customizer";
import type { PlacedGlyph, Polygon, TextAlign, Vec2 } from "../../types/geometry";
import { bboxOf } from "../calculators/geometry";
import { polygonsToPathData } from "../geometry/svg-path";
import type { LoadedFont } from "../../types/text";
import { glyphFor } from "./glyph";

/** Nominal font size: 100 units. */
export const LAYOUT_SIZE = 100;
/** Line height as a share of the font size. */
export const LINE_GAP = 1.25;
/** Bézier curves are split into this many straight segments. */
const CURVE_STEPS = 6;

export type Align = TextAlign;

export interface TextLayoutOptions {
  align?: TextAlign;
  /** Extra space between letters as a share of the font size. */
  letterSpacing?: number;
  upper?: boolean;
  maxLines?: number;
  /**
   * Font of each line (Денис 10.10: a different font per line, the customer's own fonts
   * included). A missing entry uses the main font.
   */
  lineFonts?: (LoadedFont | null | undefined)[];
}

export interface TextDesignResult {
  design: VectorDesign;
  /** Glyphs with contours in layout units (multiply by the sheet scale for mm). */
  glyphs: PlacedGlyph[];
  /** Cap height in layout units. */
  capUnits: number;
  /** Characters the font does not have. */
  missing: string[];
  /** SVG path data in layout units (preview of the plain text). */
  pathData: string;
}

/** Flattens opentype path commands to closed polylines. */
export function flattenCommands(commands: opentype.PathCommand[]): Vec2[][] {
  const out: Vec2[][] = [];
  let current: Vec2[] | null = null;
  let x = 0;
  let y = 0;
  for (const c of commands) {
    if (c.type === "M") {
      current = [[c.x, c.y]];
      out.push(current);
      x = c.x;
      y = c.y;
      continue;
    }
    if (!current) continue;
    if (c.type === "L") {
      current.push([c.x, c.y]);
      x = c.x;
      y = c.y;
    } else if (c.type === "Q") {
      for (let i = 1; i <= CURVE_STEPS; i++) {
        const t = i / CURVE_STEPS;
        const a = 1 - t;
        current.push([a * a * x + 2 * a * t * c.x1 + t * t * c.x, a * a * y + 2 * a * t * c.y1 + t * t * c.y]);
      }
      x = c.x;
      y = c.y;
    } else if (c.type === "C") {
      for (let i = 1; i <= CURVE_STEPS; i++) {
        const t = i / CURVE_STEPS;
        const a = 1 - t;
        current.push([
          a * a * a * x + 3 * a * a * t * c.x1 + 3 * a * t * t * c.x2 + t * t * t * c.x,
          a * a * a * y + 3 * a * a * t * c.y1 + 3 * a * t * t * c.y2 + t * t * t * c.y,
        ]);
      }
      x = c.x;
      y = c.y;
    }
  }
  return out.filter((polyline) => polyline.length > 2);
}

/** Cap height of the font in layout units (height of «Н»). */
export function capHeightUnits(font: LoadedFont): number {
  // A customer's font may have only Latin letters: Cyrillic «Н», then Latin «H», then 70 % of the size.
  for (const ch of ["Н", "H"]) {
    const sample = glyphFor(font.faces, ch);
    const top = sample.ok ? sample.glyph.getBoundingBox().y2 ?? 0 : 0;
    if (top > 0) return (top / sample.font.unitsPerEm) * LAYOUT_SIZE;
  }
  return LAYOUT_SIZE * 0.7;
}

/** Lays out the text, see the top of the file. */
export function textToDesign(font: LoadedFont, text: string, options: TextLayoutOptions = {}): TextDesignResult {
  const maxLines = options.maxLines ?? 4;
  const source = options.upper ? text.toUpperCase() : text;
  const lines = source.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, maxLines);
  const missing = new Set<string>();

  const raw: { glyphs: PlacedGlyph[]; width: number }[] = [];
  const usedFonts = new Set<LoadedFont>();
  lines.forEach((line, lineIndex) => {
    let pen = 0;
    const baseline = lineIndex * LAYOUT_SIZE * LINE_GAP;
    const chars = [...line];
    const glyphs: PlacedGlyph[] = [];
    const lineFont = options.lineFonts?.[lineIndex] ?? font;
    usedFonts.add(lineFont);
    chars.forEach((ch, i) => {
      const { font: face, glyph, ok } = glyphFor(lineFont.faces, ch);
      if (!ok) missing.add(ch);
      const scale = LAYOUT_SIZE / face.unitsPerEm;
      const path = glyph.getPath(pen, baseline, LAYOUT_SIZE);
      glyphs.push({ char: ch, line: lineIndex, baselineY: baseline, contours: flattenCommands(path.commands) });
      pen += (glyph.advanceWidth ?? 0) * scale + (i < chars.length - 1 ? (options.letterSpacing ?? 0) * LAYOUT_SIZE : 0);
    });
    raw.push({ glyphs, width: pen });
  });

  const maxWidth = Math.max(1, ...raw.map((r) => r.width));
  const aligned: PlacedGlyph[] = [];
  for (const line of raw) {
    const dx = options.align === "left" ? 0 : options.align === "right" ? maxWidth - line.width : (maxWidth - line.width) / 2;
    for (const glyph of line.glyphs) {
      aligned.push({ ...glyph, contours: glyph.contours.map((c) => c.map(([x, y]) => [x + dx, y] as Vec2)) });
    }
  }

  const all: Polygon[] = aligned.flatMap((g) => g.contours);
  const box = all.length ? bboxOf(all) : { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const glyphs: PlacedGlyph[] = aligned.map((glyph) => ({
    ...glyph,
    baselineY: glyph.baselineY - box.minY,
    contours: glyph.contours.map((c) => c.map(([x, y]) => [x - box.minX, y - box.minY] as Vec2)),
  }));

  const contours: Contour[] = [];
  glyphs.forEach((glyph, group) => {
    for (const points of glyph.contours) contours.push({ points, closed: true, group });
  });

  return {
    design: { source: "text", contours, bboxMm: { w: box.maxX - box.minX, h: box.maxY - box.minY } },
    glyphs,
    // Mixed fonts: the tallest capital sets the bridge width and the letter height shown.
    capUnits: Math.max(...[...(usedFonts.size ? usedFonts : new Set([font]))].map(capHeightUnits)),
    missing: [...missing],
    pathData: polygonsToPathData(glyphs.flatMap((g) => g.contours)),
  };
}

/** Groups of contours (one per glyph) scaled to mm and moved by (dx, dy). */
export function glyphGroupsMm(glyphs: PlacedGlyph[], scale: number, dx: number, dy: number): Vec2[][][] {
  return glyphs
    .filter((g) => g.contours.length)
    .map((g) => g.contours.map((c) => c.map(([x, y]) => [x * scale + dx, y * scale + dy] as Vec2)));
}

/** Glyphs scaled to mm and moved by (dx, dy), baseline included. */
export function glyphsToMm(glyphs: PlacedGlyph[], scale: number, dx: number, dy: number): PlacedGlyph[] {
  return glyphs.map((g) => ({
    ...g,
    baselineY: g.baselineY * scale + dy,
    contours: g.contours.map((c) => c.map(([x, y]) => [x * scale + dx, y * scale + dy] as Vec2)),
  }));
}
