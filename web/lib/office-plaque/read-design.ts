// Reads an office plaque design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make.

import type { OfficePlaqueConfig, OfficePlaqueDesign } from "../../types/office-plaque";
import type { PlaqueTextLine } from "../../types/plaques";
import { findPlaqueBase, findPlaquePlate } from "./colours";
import { DEFAULT_OFFICE_PLAQUE_CONFIG } from "./config";
import { resolvePlaqueSize } from "./size";
import { createDesignReader } from "../validation/design-reader";

const FONT_ID = /^[a-z0-9:_-]{1,80}$/i;

const read = createDesignReader("office plaque");

function readLine(raw: unknown, cfg: OfficePlaqueConfig): PlaqueTextLine {
  return read.textLine(raw, { maxChars: cfg.maxLineChars, fontId: FONT_ID, minSize: 0.6, maxSize: 1.6 });
}

export function readOfficePlaqueDesign(raw: unknown, quantity: number, cfg: OfficePlaqueConfig = DEFAULT_OFFICE_PLAQUE_CONFIG): OfficePlaqueDesign {
  const d = read.record(raw, "design");
  const sizeCode = String(d.sizeCode ?? "");
  const size = resolvePlaqueSize({ sizeCode, widthMm: read.num(d.widthMm, "width"), heightMm: read.num(d.heightMm, "height") }, cfg);
  const baseColourId = findPlaqueBase(String(d.baseColourId ?? "")).id;
  const plateColourId = findPlaquePlate(String(d.plateColourId ?? "")).id;
  const lines = read.list(d.lines, cfg.maxLines, "lines").map((line) => readLine(line, cfg));
  if (!lines.some((line) => line.text)) read.fail("nothing to engrave");
  return {
    sizeCode: sizeCode === "custom" ? "custom" : size.preset ?? "custom",
    widthMm: size.widthMm, heightMm: size.heightMm, baseColourId, plateColourId, lines,
    quantity: read.quantity(quantity),
  };
}
