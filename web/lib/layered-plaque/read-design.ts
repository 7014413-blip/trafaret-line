// Reads a two-layer plaque design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make.

import type { LayeredPlaqueDesign, LayeredPlaqueKind, LayeredPlaqueSeries } from "../../types/layered-plaque";
import type { PlaqueTextLine } from "../../types/plaques";
import { LAYERED_PLAQUE_CONFIGS } from "./configs";
import { findLayeredPlaqueMaterial } from "./materials";
import { seriesValid } from "./series";
import { resolveLayeredPlaqueSize } from "./size";
import { createDesignReader, FONT_ID_PATTERN } from "../validation/design-reader";

const KINDS = new Set<LayeredPlaqueKind>(["floor", "door", "number"]);

const read = createDesignReader("plaque");

export function readLayeredPlaqueDesign(raw: unknown, quantity: number): LayeredPlaqueDesign {
  const d = read.record(raw, "design");
  const kind = String(d.kind) as LayeredPlaqueKind;
  if (!KINDS.has(kind)) read.fail("bad kind");
  const cfg = LAYERED_PLAQUE_CONFIGS[kind];
  const sizeCode = String(d.sizeCode ?? "");
  const size = resolveLayeredPlaqueSize({ sizeCode, widthMm: read.num(d.widthMm, "width"), heightMm: read.num(d.heightMm, "height") }, cfg);
  const baseMaterialId = findLayeredPlaqueMaterial(String(d.baseMaterialId ?? "")).id;
  const overlayMaterialId = findLayeredPlaqueMaterial(String(d.overlayMaterialId ?? "")).id;
  const lines: PlaqueTextLine[] = read.list(d.lines, cfg.maxLines, "lines")
    .map((line) => read.textLine(line, { maxChars: cfg.maxLineChars, fontId: FONT_ID_PATTERN, minSize: 0.6, maxSize: 1.6 }));
  let series: LayeredPlaqueSeries | null = null;
  if (d.series != null) {
    if (cfg.seriesLine == null) read.fail("no series for this kind");
    const s = read.record(d.series, "series");
    series = { from: read.num(s.from, "series from"), to: read.num(s.to, "series to") };
    if (!seriesValid(series, cfg)) read.fail("bad series");
  }
  if (!lines.some((line) => line.text) && !series) read.fail("nothing to cut");
  return {
    kind, sizeCode: sizeCode === "custom" ? "custom" : size.preset?.code ?? "custom",
    widthMm: size.widthMm, heightMm: size.heightMm, baseMaterialId, overlayMaterialId,
    frame: d.frame === true, lines, series,
    quantity: read.quantity(quantity),
  };
}
