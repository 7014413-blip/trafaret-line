// Cut pieces of one line: every glyph on its own, or, for a joined line, neighbouring glyphs whose
// boxes touch or overlap merged into one piece (a script word whose letters run into each other).
// Boxes in layout units; the result keeps the glyphs' text and outer box.

import type { StickGlyphBox } from "../../types/stick-letters";

export function groupStickPieces(glyphs: StickGlyphBox[], joined: boolean, touchUnits: number): StickGlyphBox[] {
  const pieces: StickGlyphBox[] = [];
  for (const glyph of glyphs) {
    const last = pieces[pieces.length - 1];
    if (joined && last && glyph.minX <= last.maxX + touchUnits) {
      last.char += glyph.char;
      last.maxX = Math.max(last.maxX, glyph.maxX);
      last.minY = Math.min(last.minY, glyph.minY);
      last.maxY = Math.max(last.maxY, glyph.maxY);
      continue;
    }
    pieces.push({ ...glyph });
  }
  return pieces;
}
