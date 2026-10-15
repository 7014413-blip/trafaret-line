// Server-side price of a «Написи на планці» set: the pieces are measured with the given fonts
// (the server's own font files), laid out, checked and priced. Anything that cannot be made
// (a font or character missing, letters out of range, a piece too long) throws.

import type { JoinedWordsConfig, JoinedWordsDesign, JoinedWordsLayout, JoinedWordsPrice } from "../../types/joined-words";
import type { LoadedFont } from "../../types/text";
import { checkJoinedWords } from "./check";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";
import { findJoinedWordsMaterial } from "./find-material";
import { computeJoinedWordsLayout } from "./layout";
import { measureJoinedWordsDesign } from "./measure-design";
import { priceJoinedWords } from "./price";

export function priceJoinedWordsDesign(
  design: JoinedWordsDesign, fontFor: (fontId: string) => LoadedFont | null | undefined,
  cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG,
): { layout: JoinedWordsLayout; price: JoinedWordsPrice } {
  const measured = measureJoinedWordsDesign(design, fontFor, cfg);
  const missingFont = design.lines.findIndex((_, i) => !measured[i].ready);
  if (missingFont >= 0) throw new Error(`joined words: unknown font ${design.lines[missingFont].fontId}`);
  const layout = computeJoinedWordsLayout(design, measured.map((m) => ({ text: m.text?.measure ?? null, tail: m.tail?.measure ?? null })), cfg);
  const glyphs = measured.map((m) => ({
    missing: [...(m.text?.missing ?? []), ...(m.tail?.missing ?? [])],
    loose: [...(m.text?.loose ?? []), ...(m.tail?.loose ?? [])],
  }));
  const errors = checkJoinedWords(layout, findJoinedWordsMaterial(design.materialId), glyphs, cfg).filter((c) => c.level === "error");
  if (errors.length) throw new Error(`joined words: ${errors.map((e) => e.code).join(", ")}`);
  return { layout, price: priceJoinedWords(design, layout, cfg) };
}
