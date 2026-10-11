// Server-side price of a set of self-adhesive letters: every line is measured with the given fonts
// (the server's own font files), laid out, checked and priced. Anything that cannot be made
// (a font or character missing, letters out of range, a piece too long) throws.

import type { StickLettersConfig, StickLettersDesign, StickLettersLayout, StickLettersPrice } from "../../types/stick-letters";
import type { LoadedFont } from "../../types/text";
import { checkStickLetters } from "./check";
import { DEFAULT_STICK_LETTERS_CONFIG } from "./config";
import { computeStickLettersLayout } from "./layout";
import { measureStickLine } from "./measure-line";
import { priceStickLetters } from "./price";

export function priceStickLettersDesign(
  design: StickLettersDesign, fontFor: (fontId: string) => LoadedFont | null | undefined,
  cfg: StickLettersConfig = DEFAULT_STICK_LETTERS_CONFIG,
): { layout: StickLettersLayout; price: StickLettersPrice } {
  const measured = design.lines.map((line) => {
    const font = fontFor(line.fontId);
    if (!font) throw new Error(`stick letters: unknown font ${line.fontId}`);
    return measureStickLine(font, line.text, design.upper);
  });
  const layout = computeStickLettersLayout(design, measured.map((m) => m?.measure ?? null), cfg);
  const errors = checkStickLetters(layout, measured.map((m) => m?.missing ?? []), cfg).filter((c) => c.level === "error");
  if (errors.length) throw new Error(`stick letters: ${errors.map((e) => e.code).join(", ")}`);
  return { layout, price: priceStickLetters(design, layout, cfg) };
}
