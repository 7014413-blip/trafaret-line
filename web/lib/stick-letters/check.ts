// Checks of a set of self-adhesive letters before the cart (and on the server): something to
// cut, letters inside the limits, every piece fits the laser bed, every character in its font.
// A joined line whose font has no touching letters is a warning: the letters come apart.

import type { LocalizedText } from "../../types/customizer";
import type { StickLettersCheck, StickLettersConfig, StickLettersLayout } from "../../types/stick-letters";
import { DEFAULT_STICK_LETTERS_CONFIG } from "./config";
import { cmText } from "../format";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

export function checkStickLetters(
  layout: StickLettersLayout, missing: string[][] = [], cfg: StickLettersConfig = DEFAULT_STICK_LETTERS_CONFIG,
): StickLettersCheck[] {
  const out: StickLettersCheck[] = [];
  if (!layout.pieces.length) out.push({ level: "error", code: "empty", message: t("Напишіть хоча б одне слово.", "Напишите хотя бы одно слово.", "Type at least one word.") });
  for (const line of layout.lines) {
    const n = line.index + 1;
    if (line.capMm < cfg.minLetterMm - 0.05) {
      out.push({ level: "error", code: "letters-too-small", lineIndex: line.index, message: t(
        `Рядок ${n}: літери ${cmText(line.capMm)} см, ріжемо від ${cmText(cfg.minLetterMm)} см. Збільште висоту літер або розмір рядка.`,
        `Строка ${n}: буквы ${cmText(line.capMm)} см, режем от ${cmText(cfg.minLetterMm)} см. Увеличьте высоту букв или размер строки.`,
        `Line ${n}: letters are ${cmText(line.capMm, "en")} cm, we cut from ${cmText(cfg.minLetterMm, "en")} cm. Make the letters larger.`) });
    }
    if (line.capMm > cfg.maxLetterMm + 0.05) {
      out.push({ level: "error", code: "letters-too-large", lineIndex: line.index, message: t(
        `Рядок ${n}: літери ${cmText(line.capMm)} см, найбільше ${cmText(cfg.maxLetterMm)} см.`,
        `Строка ${n}: буквы ${cmText(line.capMm)} см, максимум ${cmText(cfg.maxLetterMm)} см.`,
        `Line ${n}: letters are ${cmText(line.capMm, "en")} cm, at most ${cmText(cfg.maxLetterMm, "en")} cm.`) });
    }
    if (line.apart) {
      out.push({ level: "warning", code: "not-joined", lineIndex: line.index, message: t(
        `Рядок ${n}: у цьому шрифті літери не торкаються, тому кожна буде окремою деталлю. Для злитого слова оберіть рукописний шрифт.`,
        `Строка ${n}: в этом шрифте буквы не касаются, поэтому каждая будет отдельной деталью. Для слитного слова выберите рукописный шрифт.`,
        `Line ${n}: the letters of this font do not touch, so each is a separate piece. Pick a script font for a joined word.`) });
    }
    const chars = missing[line.index] ?? [];
    if (chars.length) {
      out.push({ level: "error", code: "missing-glyphs", lineIndex: line.index, message: t(
        `Рядок ${n}: у шрифті немає символів ${chars.join(" ")}. Оберіть інший шрифт.`,
        `Строка ${n}: в шрифте нет символов ${chars.join(" ")}. Выберите другой шрифт.`,
        `Line ${n}: the font lacks ${chars.join(" ")}. Pick another font.`) });
    }
  }
  const long = layout.pieces.find((p) => p.width > cfg.maxPieceWidthMm || p.height > cfg.maxPieceHeightMm);
  if (long) {
    out.push({ level: "error", code: "piece-too-long", lineIndex: long.lineIndex, message: t(
      `Рядок ${long.lineIndex + 1}: деталь ${cmText(long.width)} см, одним шматком ріжемо до ${cmText(cfg.maxPieceWidthMm)} см. Зменште літери.`,
      `Строка ${long.lineIndex + 1}: деталь ${cmText(long.width)} см, одним куском режем до ${cmText(cfg.maxPieceWidthMm)} см. Уменьшите буквы.`,
      `Line ${long.lineIndex + 1}: the piece is ${cmText(long.width, "en")} cm, at most ${cmText(cfg.maxPieceWidthMm, "en")} cm. Make the letters smaller.`) });
  }
  return out;
}
