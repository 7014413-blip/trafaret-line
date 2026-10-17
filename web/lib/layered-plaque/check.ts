// Checks of a two-layer plaque before the cart: something to cut, letters large enough for the
// sheet, every character in its font, a usable series. Messages in uk / ru / en.

import type { LocalizedText } from "../../types/customizer";
import type { LayeredPlaqueCheck, LayeredPlaqueConfig, LayeredPlaqueDesign, LayeredPlaqueLayout } from "../../types/layered-plaque";
import { seriesValid } from "./series";
import { localMm } from "../plaques/local-mm";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

export function checkLayeredPlaque(
  design: LayeredPlaqueDesign, layout: LayeredPlaqueLayout, missingGlyphs: string[][], cfg: LayeredPlaqueConfig,
): LayeredPlaqueCheck[] {
  const out: LayeredPlaqueCheck[] = [];
  if (!layout.lines.length) out.push({ level: "error", code: "empty", message: t("Напишіть текст таблички.", "Напишите текст таблички.", "Type the plaque text.") });
  // Денис makes these plaques at their sizes: the product's own lowest letter applies.
  const minLetter = cfg.minLetterMm;
  for (const line of layout.lines) {
    if (line.capMm >= minLetter) continue;
    const n = line.index + 1;
    out.push({ level: "error", code: "letters-too-small", lineIndex: line.index, message: t(
      `Рядок ${n}: літери ${localMm(line.capMm)} мм, ріжемо від ${localMm(minLetter)} мм. Скоротіть текст або візьміть більший розмір.`,
      `Строка ${n}: буквы ${localMm(line.capMm)} мм, режем от ${localMm(minLetter)} мм. Сократите текст или возьмите больший размер.`,
      `Line ${n}: letters are ${localMm(line.capMm, "en")} mm, cut from ${localMm(minLetter, "en")} mm. Shorten the text or pick a larger size.`) });
  }
  missingGlyphs.forEach((chars, index) => {
    if (!chars.length) return;
    out.push({ level: "error", code: "missing-glyphs", lineIndex: index, message: t(
      `Рядок ${index + 1}: у шрифті немає символів ${chars.join(" ")}. Оберіть інший шрифт.`,
      `Строка ${index + 1}: в шрифте нет символов ${chars.join(" ")}. Выберите другой шрифт.`,
      `Line ${index + 1}: the font has no ${chars.join(" ")}. Pick another font.`) });
  });
  if (design.series && !seriesValid(design.series, cfg)) {
    out.push({ level: "error", code: "series", message: t(
      `Номери: від меншого до більшого, не більше ${cfg.maxSeries} табличок за раз.`,
      `Номера: от меньшего к большему, не больше ${cfg.maxSeries} табличек за раз.`,
      `Numbers: from the lower to the higher, at most ${cfg.maxSeries} plaques at once.`) });
  }
  return out;
}
