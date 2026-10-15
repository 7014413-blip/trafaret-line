// Measures an edge text of a round sign in its font: every glyph's advance and outline at the
// layout size (lib/text/text-layout.ts), baseline at y = 0. The placement along the circle is
// lib/business-sign/place-arc.ts, so the measures do not depend on the sign size.

import type { BusinessSignArcMeasure } from "../../types/business-sign";
import type { LoadedFont } from "../../types/text";
import { glyphFor } from "../text/glyph";
import { LAYOUT_SIZE, capHeightUnits, flattenCommands } from "../text/text-layout";

export function measureArcText(font: LoadedFont, text: string): BusinessSignArcMeasure | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const missing = new Set<string>();
  const glyphs: BusinessSignArcMeasure["glyphs"] = [];
  let totalAdvance = 0;
  for (const ch of clean) {
    const { font: face, glyph, ok } = glyphFor(font.faces, ch);
    if (!ok) missing.add(ch);
    const advance = ((glyph.advanceWidth ?? 0) * LAYOUT_SIZE) / face.unitsPerEm;
    const contours = flattenCommands(glyph.getPath(0, 0, LAYOUT_SIZE).commands).map((c) => c.map(([x, y]) => [x, y] as [number, number]));
    glyphs.push({ advance, contours });
    totalAdvance += advance;
  }
  return { text: clean, capUnits: capHeightUnits(font), glyphs, totalAdvance, missing: [...missing] };
}
