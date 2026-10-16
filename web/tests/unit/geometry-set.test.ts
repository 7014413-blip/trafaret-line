// Proof set of the constructors (ТЗ «prompt-konstruktory» v0.9 §9): the cut and the welded
// piece are built from the real fonts of the site, without a browser, and checked against
// the production rules of lib/geometry/config.ts.
//  Stencil: no island falls out, every bridge is straight, bridge width within the limits and
//  not below the minimum material; bridges add no thin material of their own.
//  Topper: exactly one piece, every part of every letter (dots of і, ї, й, full stops) is in
//  the piece, connectors not thinner than the minimum material, skewers hang from letters,
//  not from a dot.
//  Speed: «ОБОРОНА» stencil and «З днем народження» topper within 300 ms on Node.
//  Offsets: clipper2-js offsets checked on a square (see lib/geometry/clipper-offset-fix.ts).

import { describe, expect, it } from "vitest";
import { bboxOf, polygonsNetArea } from "@/lib/calculators/geometry";
import { designPlacement } from "@/lib/calculators/design-fit";
import { buildStencilCut } from "@/lib/geometry/bridges";
import { FillRule, inflate, intersect, union, unionTree } from "@/lib/geometry/clipper";
import { CONSTRUCTOR_CONFIG, minMaterialMm } from "@/lib/geometry/config";
import { DEFAULT_LASER } from "@/lib/geometry/laser-config";
import { columnExtent, connectorWidth, DEFAULT_WELD, piecesOf, stackLines, tightenLines, weldText } from "@/lib/geometry/weld";
import { weldAtWidth } from "@/lib/geometry/weld-sizing";
import { glyphsToMm, textToDesign } from "@/lib/text/text-layout";
import { cutRequestFor } from "@/store/customizer-store";
import type { MaterialType } from "@/types/customizer";
import type { PlacedGlyph, StencilCutResult, ThinZone, Vec2, WeldOptions } from "@/types/geometry";
import { testFont } from "./support/node-font";

const STENCIL_WORDS = ["ОБОРОНА", "АРФА 48", "8 Березня", "Обіцяю тебе", "Їжак", "Йога", "Софія", "0689"];
const ALPHABET_UPPER = "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ";
const ALPHABET_LOWER = "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя";
const TOPPER_WORDS = ["Just Married", "10.10.2026", "Софія", "Їжак", "Mr & Mrs", "З днем народження"];
/** Default font of «Свій напис», a serif and a handwritten one. */
const STENCIL_FONTS = ["montserrat", "pt-serif", "caveat"];
const TOPPER_FONTS = ["montserrat", "pt-serif", "pacifico"];
const STENCIL_MATERIAL: MaterialType = "pet_thin";
const TOPPER_MATERIAL: MaterialType = "acrylic_3";
const LIMIT_MS = 300;

interface StencilCase {
  cut: StencilCutResult;
  /** Same layout without bridges: what the letters themselves leave of the sheet. */
  plain: StencilCutResult;
}

/** The request «Свій напис» sends to the geometry worker: same sheet, margins and bridge width as the store. */
function stencilRequest(fontId: string, text: string, widthMm: number) {
  const layout = textToDesign(testFont(fontId), text, { align: "center" });
  const { scale } = designPlacement(layout.design, widthMm, 15, false);
  const request = cutRequestFor({
    section: "sweet", source: "text", text, fontFamily: fontId, materialId: STENCIL_MATERIAL, shape: "rect",
    widthMm, marginMm: 15, quantity: 1, surface: "cake", complexity: 1, design: layout.design,
    capHeightMm: layout.capUnits * scale, bridgeStrength: "normal",
  });
  if (!request) throw new Error(`no design for ${text}`);
  return request;
}

function stencil(fontId: string, text: string, widthMm: number): StencilCase {
  const request = stencilRequest(fontId, text, widthMm);
  return {
    cut: buildStencilCut(request.groups, request.options),
    plain: buildStencilCut(request.groups, { ...request.options, skipBridges: true }),
  };
}

/** A zone of `zones` that is not near any zone of `before` (within `radiusMm`). */
function newZones(zones: ThinZone[], before: ThinZone[], radiusMm: number): ThinZone[] {
  return zones.filter((z) => !before.some((b) => b.kind === z.kind && Math.hypot(b.at[0] - z.at[0], b.at[1] - z.at[1]) <= radiusMm));
}

function checkStencil({ cut, plain }: StencilCase): void {
  const minMaterial = minMaterialMm(STENCIL_MATERIAL);
  expect(cut.islands.filter((island) => !island.connected)).toEqual([]);
  for (const island of cut.islands) expect(island.bridgeCount).toBeGreaterThan(0);
  for (const bridge of cut.bridges) {
    const dx = Math.abs(bridge.to[0] - bridge.from[0]);
    const dy = Math.abs(bridge.to[1] - bridge.from[1]);
    expect(Math.min(dx, dy), "straight bridge").toBeLessThan(1e-6);
    expect(bridge.widthMm).toBeGreaterThanOrEqual(CONSTRUCTOR_CONFIG.bridgeWidthMinMm);
    expect(bridge.widthMm).toBeLessThanOrEqual(CONSTRUCTOR_CONFIG.bridgeWidthMaxMm);
    expect(bridge.widthMm).toBeGreaterThanOrEqual(minMaterial);
  }
  // Thin places the font itself has (the sharp counter of «А») are shown to the customer as
  // warnings; the bridges must not add any of their own.
  const material = (zones: ThinZone[]) => zones.filter((z) => z.kind === "material");
  expect(newZones(material(cut.thinZones), material(plain.thinZones), CONSTRUCTOR_CONFIG.bridgeWidthMaxMm * 2)).toEqual([]);
}

describe("offsets (lib/geometry/clipper-offset-fix.ts)", () => {
  const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];

  it("shrinks a 10 mm square to the 8 mm square inside it", () => {
    const [shrunk, ...rest] = inflate([square], -1, DEFAULT_LASER.clipperScale);
    expect(rest).toEqual([]);
    expect(bboxOf([shrunk])).toEqual({ minX: 1, minY: 1, maxX: 9, maxY: 9 });
  });

  it("grows it by 1 mm with round corners, in both windings", () => {
    for (const polygon of [square, [...square].reverse()]) {
      const grown = inflate([polygon], 1, DEFAULT_LASER.clipperScale);
      expect(bboxOf(grown)).toEqual({ minX: -1, minY: -1, maxX: 11, maxY: 11 });
      expect(polygonsNetArea(grown)).toBeCloseTo(100 + 40 + Math.PI, 0);
    }
  });
});

describe("stencil proof set (§9)", () => {
  for (const fontId of STENCIL_FONTS) {
    for (const text of STENCIL_WORDS) {
      it(`${fontId}: «${text}» on a 30 cm stencil`, () => checkStencil(stencil(fontId, text, 300)), 30_000);
    }
  }
  for (const fontId of STENCIL_FONTS.slice(0, 2)) {
    it(`${fontId}: Ukrainian alphabet, capitals and small letters`, () => {
      checkStencil(stencil(fontId, ALPHABET_UPPER, 900));
      checkStencil(stencil(fontId, ALPHABET_LOWER, 900));
    }, 60_000);
  }
});

interface TopperCase {
  options: WeldOptions;
  /** Letters where the welder put them (same coordinates as the piece). */
  placed: PlacedGlyph[];
  shapes: ReturnType<typeof weldText>;
  capMm: number;
}

/** A topper 20 cm wide welded like the constructor does it, letters kept to check against. */
function topper(fontId: string, text: string, options: WeldOptions): TopperCase {
  const layout = textToDesign(testFont(fontId), text, { align: "center" });
  const sized = weldAtWidth(layout.glyphs, layout.capUnits, 200, "center", options);
  if (!sized) throw new Error(`empty word ${text}`);
  const glyphs = glyphsToMm(layout.glyphs, sized.scale, 0, 0);
  const placed = stackLines(tightenLines(glyphs, sized.capMm, options.overlapShare, "center"), sized.capMm, options.overlapShare);
  return { options, placed, shapes: weldText(glyphs, sized.capMm, "center", options), capMm: sized.capMm };
}

/** Separate parts of every letter: the body, the dots of і and ї, a full stop. */
function letterParts(placed: PlacedGlyph[]): { char: string; outline: Vec2[][]; area: number }[] {
  const scale = DEFAULT_LASER.clipperScale;
  return placed.filter((g) => g.contours.length).flatMap((g) =>
    piecesOf(unionTree(union(g.contours, scale, FillRule.EvenOdd), scale)).map((piece) => ({
      char: g.char, outline: piece.all, area: polygonsNetArea(piece.all),
    })));
}

function checkTopper({ options, placed, shapes, capMm }: TopperCase): void {
  const scale = DEFAULT_LASER.clipperScale;
  expect(shapes.pieces).toBe(1);
  const parts = letterParts(placed);
  for (const part of parts) {
    // Compared 0.2 mm inside the letter: Clipper is unreliable on edges the two shapes share.
    const inner = inflate(part.outline, -0.2, scale);
    const kept = polygonsNetArea(intersect(inner, shapes.shapes, scale));
    expect(kept / polygonsNetArea(inner), `part of «${part.char}» in the piece`).toBeGreaterThan(0.99);
  }
  expect(connectorWidth(options, capMm)).toBeGreaterThanOrEqual(minMaterialMm(TOPPER_MATERIAL));
  if (!options.skewers.count) return;
  // Every skewer hangs from the lowest part above it; that part must be a letter, not a dot.
  const box = shapes.bbox;
  const width = box.maxX - box.minX;
  const xs = options.skewers.count === 1 ? [box.minX + width / 2] : [box.minX + width * 0.3, box.minX + width * 0.7];
  const smallest = Math.max(...parts.map((p) => p.area)) * 0.15;
  for (const x of xs) {
    const above = parts
      .map((part) => ({ part, column: columnExtent(part.outline, x) }))
      .filter((c): c is { part: (typeof parts)[number]; column: { min: number; max: number } } => c.column !== null)
      .sort((a, b) => b.column.max - a.column.max);
    expect(above.length, `something above the skewer at x=${x.toFixed(1)}`).toBeGreaterThan(0);
    expect(above[0].part.area, `skewer at x=${x.toFixed(1)} hangs from «${above[0].part.char}»`).toBeGreaterThan(smallest);
  }
}

const withSkewers = (count: 1 | 2): WeldOptions => ({ ...DEFAULT_WELD, skewers: { ...DEFAULT_WELD.skewers, count } });

describe("topper proof set (§9)", () => {
  for (const fontId of TOPPER_FONTS) {
    for (const text of TOPPER_WORDS) {
      it(`${fontId}: «${text}» is one piece with every dot`, () => checkTopper(topper(fontId, text, withSkewers(1))), 30_000);
    }
    it(`${fontId}: «ОБОРОНА» printed on a bar with two skewers`, () => {
      checkTopper(topper(fontId, "ОБОРОНА", { ...withSkewers(2), baseline: { ...DEFAULT_WELD.baseline, enabled: true } }));
    }, 30_000);
  }
});

/** Fastest of three runs after a warm-up, ms: one slow tick of the machine does not fail CI. */
function bestOf(run: () => void): number {
  run();
  let best = Infinity;
  for (let i = 0; i < 3; i++) {
    const started = performance.now();
    run();
    best = Math.min(best, performance.now() - started);
  }
  return best;
}

describe("constructor speed (§9)", () => {
  it(`«ОБОРОНА» stencil is cut within ${LIMIT_MS} ms`, () => {
    const request = stencilRequest("montserrat", "ОБОРОНА", 300);
    expect(bestOf(() => buildStencilCut(request.groups, request.options))).toBeLessThanOrEqual(LIMIT_MS);
  }, 60_000);

  it(`«З днем народження» topper is welded within ${LIMIT_MS} ms`, () => {
    const layout = textToDesign(testFont("pacifico"), "З днем народження", { align: "center" });
    expect(bestOf(() => weldAtWidth(layout.glyphs, layout.capUnits, 200, "center", withSkewers(1)))).toBeLessThanOrEqual(LIMIT_MS);
  }, 60_000);
});
