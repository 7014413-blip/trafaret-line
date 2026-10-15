// Measures every piece of a «Написи на планці» set in its line's font. The browser passes the
// fonts it has loaded, the server its own font files (lib/text/node-fonts.ts), so both get
// the same sizes and the same price. A line whose font is not loaded yet gets null pieces.

import type { JoinedWordsConfig, JoinedWordsDesign } from "../../types/joined-words";
import type { LoadedFont } from "../../types/text";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";
import { measureJoinedPiece, type MeasuredJoinedPiece } from "./measure-piece";

export interface MeasuredJoinedLine {
  text: MeasuredJoinedPiece | null;
  tail: MeasuredJoinedPiece | null;
  /** The line's font is loaded (or the line is empty). */
  ready: boolean;
}

export function measureJoinedWordsDesign(
  design: Pick<JoinedWordsDesign, "lines" | "upper">, fontFor: (fontId: string) => LoadedFont | null | undefined,
  cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG,
): MeasuredJoinedLine[] {
  return design.lines.map((line) => {
    const empty = !line.text.trim() && !line.tail.trim();
    const font = empty ? null : fontFor(line.fontId);
    if (!font) return { text: null, tail: null, ready: empty };
    return {
      text: measureJoinedPiece(font, line.text, design.upper, cfg),
      tail: measureJoinedPiece(font, line.tail, design.upper, cfg),
      ready: true,
    };
  });
}
