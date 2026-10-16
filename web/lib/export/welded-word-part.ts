// Production part of a «Цілим словом» line: the word is welded again at the paid width with
// the stored options (lib/geometry/weld-sizing.ts), the same code that measured it at checkout.

import type { ProductionPart, WeldedWordInput } from "../../types/production";
import { weldAtWidth } from "../geometry/weld-sizing";
import { textToDesign } from "../text/text-layout";
import { pieceProductionPart } from "./piece-part";

export function weldedWordPart(input: WeldedWordInput): ProductionPart {
  const layout = textToDesign(input.font, input.text, { align: input.align, upper: input.upper, lineFonts: input.lineFonts });
  if (layout.missing.length) throw new Error(`font has no glyphs for: ${layout.missing.join(" ")}`);
  const sized = weldAtWidth(layout.glyphs, layout.capUnits, input.widthMm, input.align, input.options);
  if (!sized) throw new Error("empty word");
  const warnings = sized.result.pieces > 1 ? [`Слово розпадається на ${sized.result.pieces} частини. Перевірте макет перед різанням`] : [];
  return pieceProductionPart(sized.result.shapes, "word", input.colourHex, warnings);
}
