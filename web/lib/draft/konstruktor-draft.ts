// Reads a «Свій напис» draft from an address. Every field is checked and kept in the ranges of
// the constructor; anything wrong makes the whole draft null and the default layout opens.

import { MATERIALS } from "../materials";
import { createDesignReader, FONT_ID_PATTERN } from "../validation/design-reader";
import { oneOf } from "./one-of";
import type { KonstruktorDraft } from "../../types/draft";
import type { MaterialType } from "../../types/customizer";
import type { BridgeStrength, TextAlign } from "../../types/geometry";

const read = createDesignReader("konstruktor draft");

const MAX_TEXT_CHARS = 300;
const MAX_LINES = 4;
const BRIDGES: BridgeStrength[] = ["thin", "normal", "strong"];
const ALIGNS: TextAlign[] = ["left", "center", "right"];

const between = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value)));

const pick = <T>(value: unknown, allowed: readonly T[], what: string): T => oneOf(read, value, allowed, what);

function fontId(value: unknown): string {
  const id = String(value ?? "");
  if (!FONT_ID_PATTERN.test(id)) read.fail("bad font id");
  return id;
}

export function parseKonstruktorDraft(
  raw: unknown,
  materials: { stencil: readonly MaterialType[]; weld: readonly MaterialType[] },
): KonstruktorDraft | null {
  try {
    const d = read.record(raw, "draft");
    const text = String(d.text ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ");
    if (!text.trim() || [...text].length > MAX_TEXT_CHARS) read.fail("bad text");
    const w = read.record(d.weld, "weld");
    const weldMaterial = pick(w.materialId, materials.weld, "weld material");
    const colourId = String(w.colourId ?? "");
    if (!MATERIALS[weldMaterial].colours.some((c) => c.id === colourId)) read.fail("bad colour");
    return {
      mode: pick(d.mode, ["stencil", "weld"] as const, "mode"),
      text,
      fontId: fontId(d.fontId),
      widthMm: between(read.num(d.widthMm, "width"), 100, 4000),
      marginMm: between(read.num(d.marginMm, "margin"), 0, 200),
      shape: pick(d.shape, ["rect", "square"] as const, "shape"),
      materialId: pick(d.materialId, materials.stencil, "material"),
      bridgeStrength: pick(d.bridgeStrength, BRIDGES, "bridges"),
      align: pick(d.align, ALIGNS, "align"),
      upper: d.upper === true,
      lineFontIds: read.list(d.lineFontIds ?? [], MAX_LINES, "line fonts").map((id) => (id === "" ? "" : fontId(id))),
      byLetter: d.byLetter === true,
      letterMm: between(read.num(d.letterMm, "letter height"), 10, 1000),
      weld: {
        widthMm: between(read.num(w.widthMm, "weld width"), 50, 1000),
        materialId: weldMaterial,
        colourId,
        overlapShare: Math.max(0, Math.min(0.2, read.num(w.overlapShare, "overlap"))),
        baseline: w.baseline === true,
        outline: w.outline === true,
        skewers: pick(w.skewers, [0, 1, 2] as const, "skewers"),
        skewerLengthMm: between(read.num(w.skewerLengthMm, "skewer length"), 40, 200),
      },
    };
  } catch {
    return null;
  }
}
