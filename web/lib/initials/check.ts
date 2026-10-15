// Checks of wedding initials: something to cut, letters large enough for the sheet, every
// character in the font; in a topper, parts that do not reach the strip come off separately.

import type { LocalizedText } from "../../types/customizer";
import type { InitialsCheck, InitialsConfig, InitialsDesign } from "../../types/initials";
import { findJoinedWordsMaterial } from "../joined-words/find-material";
import { DEFAULT_INITIALS_CONFIG } from "./config";
import type { MeasuredInitials } from "./measure";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

export function checkInitials(design: InitialsDesign, measured: MeasuredInitials, cfg: InitialsConfig = DEFAULT_INITIALS_CONFIG): InitialsCheck[] {
  const out: InitialsCheck[] = [];
  if (!measured.first && !measured.second) out.push({ level: "error", code: "empty", message: t("Напишіть ініціали.", "Напишите инициалы.", "Type the initials.") });
  const minLetter = Math.max(cfg.minLetterMm, findJoinedWordsMaterial(design.materialId).minLetterMm);
  if (design.letterHeightMm < minLetter) {
    out.push({ level: "error", code: "letters-too-small", message: t(
      `Літери ${cm(design.letterHeightMm)} см, з цього листа ріжемо від ${cm(minLetter)} см.`,
      `Буквы ${cm(design.letterHeightMm)} см, из этого листа режем от ${cm(minLetter)} см.`,
      `Letters are ${cm(design.letterHeightMm)} cm, this sheet is cut from ${cm(minLetter)} cm.`) });
  }
  const parts = [measured.first, measured.sep, measured.second];
  const missing = [...new Set(parts.flatMap((p) => p?.missing ?? []))];
  if (missing.length) {
    out.push({ level: "error", code: "missing-glyphs", message: t(
      `У шрифті немає символів ${missing.join(" ")}. Оберіть інший шрифт.`,
      `В шрифте нет символов ${missing.join(" ")}. Выберите другой шрифт.`,
      `The font has no ${missing.join(" ")}. Pick another font.`) });
  }
  const loose = [...new Set(parts.flatMap((p) => p?.loose ?? []))];
  if (design.mode === "topper" && loose.length) {
    out.push({ level: "warning", code: "loose-parts", message: t(
      `У ${loose.join(" ")} є частини, що не дістають планки: їх виріжемо окремо.`,
      `У ${loose.join(" ")} есть части, которые не достают планки: их вырежем отдельно.`,
      `${loose.join(" ")} have parts that do not reach the strip: they are cut separately.`) });
  }
  return out;
}
