// Checks of an office plaque before the cart: something to engrave, letters large enough,
// every character present in its font. Messages in uk / ru / en.

import type { LocalizedText } from "../../types/customizer";
import type { OfficePlaqueCheck, OfficePlaqueConfig, OfficePlaqueLayout } from "../../types/office-plaque";
import { DEFAULT_OFFICE_PLAQUE_CONFIG } from "./config";
import { localMm } from "../plaques/local-mm";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

export function checkOfficePlaque(
  layout: OfficePlaqueLayout, missingGlyphs: string[][] = [], cfg: OfficePlaqueConfig = DEFAULT_OFFICE_PLAQUE_CONFIG,
): OfficePlaqueCheck[] {
  const out: OfficePlaqueCheck[] = [];
  if (!layout.lines.length) out.push({ level: "error", code: "empty", message: t("Напишіть текст для гравіювання.", "Напишите текст для гравировки.", "Type the text to engrave.") });
  for (const line of layout.lines) {
    const n = line.index + 1;
    if (line.capMm < cfg.absoluteMinLetterMm) {
      out.push({ level: "error", code: "letters-too-small", lineIndex: line.index, message: t(
        `Рядок ${n}: літери ${localMm(line.capMm)} мм, так дрібно гравіювання не читається. Скоротіть текст або візьміть більший розмір.`,
        `Строка ${n}: буквы ${localMm(line.capMm)} мм, так мелко гравировка не читается. Сократите текст или возьмите больший размер.`,
        `Line ${n}: letters are ${localMm(line.capMm, "en")} mm, too small to read. Shorten the text or pick a larger size.`) });
    } else if (line.capMm < cfg.smallLetterMm) {
      out.push({ level: "warning", code: "letters-small", lineIndex: line.index, message: t(
        `Рядок ${n}: літери ${localMm(line.capMm)} мм, читаються лише зблизька.`,
        `Строка ${n}: буквы ${localMm(line.capMm)} мм, читаются только вблизи.`,
        `Line ${n}: letters are ${localMm(line.capMm, "en")} mm, readable only up close.`) });
    }
  }
  missingGlyphs.forEach((chars, index) => {
    if (!chars.length) return;
    out.push({ level: "warning", code: "missing-glyphs", lineIndex: index, message: t(
      `Рядок ${index + 1}: у шрифті немає символів ${chars.join(" ")}. Оберіть інший шрифт.`,
      `Строка ${index + 1}: в шрифте нет символов ${chars.join(" ")}. Выберите другой шрифт.`,
      `Line ${index + 1}: the font has no ${chars.join(" ")}. Pick another font.`) });
  });
  return out;
}
