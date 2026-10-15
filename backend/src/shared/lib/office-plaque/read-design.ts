// Reads an office plaque design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make.

import type { OfficePlaqueConfig, OfficePlaqueDesign } from "../../types/office-plaque";
import type { PlaqueTextLine } from "../../types/plaques";
import { findPlaqueBase, findPlaquePlate } from "./colours";
import { DEFAULT_OFFICE_PLAQUE_CONFIG } from "./config";
import { resolvePlaqueSize } from "./size";

const FONT_ID = /^[a-z0-9:_-]{1,80}$/i;

const record = (value: unknown, what: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`office plaque: ${what} is not an object`);
  return value as Record<string, unknown>;
};
const num = (value: unknown, what: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`office plaque: ${what} is not a number`);
  return n;
};
/** Customer text: control characters removed, spaces collapsed. */
const clean = (value: unknown) => String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

function readLine(raw: unknown, cfg: OfficePlaqueConfig): PlaqueTextLine {
  const line = record(raw, "line");
  const text = clean(line.text);
  if ([...text].length > cfg.maxLineChars) throw new Error("office plaque: line is too long");
  const fontId = String(line.fontId ?? "");
  if (!FONT_ID.test(fontId)) throw new Error("office plaque: bad font id");
  const size = num(line.size, "line size");
  if (size < 0.6 || size > 1.6) throw new Error("office plaque: line size out of range");
  return { text, fontId, size };
}

export function readOfficePlaqueDesign(raw: unknown, quantity: number, cfg: OfficePlaqueConfig = DEFAULT_OFFICE_PLAQUE_CONFIG): OfficePlaqueDesign {
  const d = record(raw, "design");
  const sizeCode = String(d.sizeCode ?? "");
  const size = resolvePlaqueSize({ sizeCode, widthMm: num(d.widthMm, "width"), heightMm: num(d.heightMm, "height") }, cfg);
  const baseColourId = findPlaqueBase(String(d.baseColourId ?? "")).id;
  const plateColourId = findPlaquePlate(String(d.plateColourId ?? "")).id;
  if (!Array.isArray(d.lines) || d.lines.length > cfg.maxLines) throw new Error("office plaque: bad lines");
  const lines = d.lines.map((line) => readLine(line, cfg));
  if (!lines.some((line) => line.text)) throw new Error("office plaque: nothing to engrave");
  return {
    sizeCode: sizeCode === "custom" ? "custom" : size.preset ?? "custom",
    widthMm: size.widthMm, heightMm: size.heightMm, baseColourId, plateColourId, lines,
    quantity: Math.max(1, Math.min(9999, Math.round(quantity))),
  };
}
