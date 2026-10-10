// Glyph lookup across the faces of one font (Latin and Cyrillic subsets are separate files).
// No I/O, so the same file runs in the browser and on the Medusa server.

import type * as opentype from "opentype.js";

/** First face that has the character; the first face's .notdef otherwise. */
export function glyphFor(faces: opentype.Font[], ch: string): { font: opentype.Font; glyph: opentype.Glyph; ok: boolean } {
  for (const face of faces) {
    const index = face.charToGlyphIndex(ch);
    if (index > 0) return { font: face, glyph: face.glyphs.get(index), ok: true };
  }
  return { font: faces[0], glyph: faces[0].charToGlyph(ch), ok: /\s/.test(ch) };
}
