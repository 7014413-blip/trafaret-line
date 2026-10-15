// Reads a two-layer plaque design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make.

import type { LayeredPlaqueDesign, LayeredPlaqueKind, LayeredPlaqueSeries } from "../../types/layered-plaque";
import type { PlaqueTextLine } from "../../types/plaques";
import { LAYERED_PLAQUE_CONFIGS } from "./configs";
import { findLayeredPlaqueMaterial } from "./materials";
import { seriesValid } from "./series";
import { resolveLayeredPlaqueSize } from "./size";

const FONT_ID = /^[a-z0-9:_./-]{1,120}$/i;
const KINDS = new Set<LayeredPlaqueKind>(["floor", "door", "number"]);

const record = (value: unknown, what: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`plaque: ${what} is not an object`);
  return value as Record<string, unknown>;
};
const num = (value: unknown, what: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`plaque: ${what} is not a number`);
  return n;
};
/** Customer text: control characters removed, spaces collapsed. */
const clean = (value: unknown) => String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

export function readLayeredPlaqueDesign(raw: unknown, quantity: number): LayeredPlaqueDesign {
  const d = record(raw, "design");
  const kind = String(d.kind) as LayeredPlaqueKind;
  if (!KINDS.has(kind)) throw new Error("plaque: bad kind");
  const cfg = LAYERED_PLAQUE_CONFIGS[kind];
  const sizeCode = String(d.sizeCode ?? "");
  const size = resolveLayeredPlaqueSize({ sizeCode, widthMm: num(d.widthMm, "width"), heightMm: num(d.heightMm, "height") }, cfg);
  const baseMaterialId = findLayeredPlaqueMaterial(String(d.baseMaterialId ?? "")).id;
  const overlayMaterialId = findLayeredPlaqueMaterial(String(d.overlayMaterialId ?? "")).id;
  if (!Array.isArray(d.lines) || d.lines.length > cfg.maxLines) throw new Error("plaque: bad lines");
  const lines: PlaqueTextLine[] = d.lines.map((rawLine) => {
    const line = record(rawLine, "line");
    const text = clean(line.text);
    if ([...text].length > cfg.maxLineChars) throw new Error("plaque: line is too long");
    const fontId = String(line.fontId ?? "");
    if (!FONT_ID.test(fontId)) throw new Error("plaque: bad font id");
    const lineSize = num(line.size, "line size");
    if (lineSize < 0.6 || lineSize > 1.6) throw new Error("plaque: line size out of range");
    return { text, fontId, size: lineSize };
  });
  let series: LayeredPlaqueSeries | null = null;
  if (d.series != null) {
    if (cfg.seriesLine == null) throw new Error("plaque: no series for this kind");
    const s = record(d.series, "series");
    series = { from: num(s.from, "series from"), to: num(s.to, "series to") };
    if (!seriesValid(series, cfg)) throw new Error("plaque: bad series");
  }
  if (!lines.some((line) => line.text) && !series) throw new Error("plaque: nothing to cut");
  return {
    kind, sizeCode: sizeCode === "custom" ? "custom" : size.preset?.code ?? "custom",
    widthMm: size.widthMm, heightMm: size.heightMm, baseMaterialId, overlayMaterialId,
    frame: d.frame === true, lines, series,
    quantity: Math.max(1, Math.min(9999, Math.round(quantity))),
  };
}
