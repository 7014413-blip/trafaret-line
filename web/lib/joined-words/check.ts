// Checks of a «Написи на планці» set before the cart (and on the server): something to cut,
// letters inside the limits of the sheet, every piece fits the laser bed, every character in
// its font; parts that do not reach the strip are a warning (they come as separate small pieces).

import type { LocalizedText } from "../../types/customizer";
import type { JoinedWordsCheck, JoinedWordsConfig, JoinedWordsLayout, JoinedWordsMaterial } from "../../types/joined-words";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";
import { cmText } from "../format";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

export interface JoinedLineGlyphs {
  missing: string[];
  loose: string[];
}

export function checkJoinedWords(
  layout: JoinedWordsLayout, sheet: JoinedWordsMaterial, glyphs: JoinedLineGlyphs[] = [], cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG,
): JoinedWordsCheck[] {
  const out: JoinedWordsCheck[] = [];
  if (!layout.pieces.length) out.push({ level: "error", code: "empty", message: t("Напишіть хоча б одне слово.", "Напишите хотя бы одно слово.", "Type at least one word.") });
  const minLetter = Math.max(cfg.minLetterMm, sheet.minLetterMm);
  const seen = new Set<string>();
  for (const piece of layout.pieces) {
    const n = piece.lineIndex + 1;
    const once = (code: string) => { const key = `${code}|${piece.lineIndex}`; if (seen.has(key)) return false; seen.add(key); return true; };
    if (piece.capMm < minLetter - 0.05 && once("small")) {
      out.push({ level: "error", code: "letters-too-small", lineIndex: piece.lineIndex, message: t(
        `Рядок ${n}: літери ${cmText(piece.capMm)} см, з цього листа ріжемо від ${cmText(minLetter)} см. Збільште висоту літер або розмір рядка.`,
        `Строка ${n}: буквы ${cmText(piece.capMm)} см, из этого листа режем от ${cmText(minLetter)} см. Увеличьте высоту букв или размер строки.`,
        `Line ${n}: letters are ${cmText(piece.capMm, "en")} cm, this sheet is cut from ${cmText(minLetter, "en")} cm. Make the letters larger.`) });
    }
    if (piece.capMm > cfg.maxLetterMm + 0.05 && once("large")) {
      out.push({ level: "error", code: "letters-too-large", lineIndex: piece.lineIndex, message: t(
        `Рядок ${n}: літери ${cmText(piece.capMm)} см, найбільше ${cmText(cfg.maxLetterMm)} см. Для більших літер оберіть вивіску.`,
        `Строка ${n}: буквы ${cmText(piece.capMm)} см, максимум ${cmText(cfg.maxLetterMm)} см. Для больших букв выберите вывеску.`,
        `Line ${n}: letters are ${cmText(piece.capMm, "en")} cm, at most ${cmText(cfg.maxLetterMm, "en")} cm. Pick a sign for larger letters.`) });
    }
    if ((piece.widthMm > cfg.maxPieceWidthMm || piece.heightMm > cfg.maxPieceHeightMm) && once("long")) {
      out.push({ level: "error", code: "piece-too-long", lineIndex: piece.lineIndex, message: t(
        `Рядок ${n}: деталь ${cmText(piece.widthMm)} см, одним шматком ріжемо до ${cmText(cfg.maxPieceWidthMm)} см. Розбийте рядок на два або зменште літери.`,
        `Строка ${n}: деталь ${cmText(piece.widthMm)} см, одним куском режем до ${cmText(cfg.maxPieceWidthMm)} см. Разбейте строку на две или уменьшите буквы.`,
        `Line ${n}: the piece is ${cmText(piece.widthMm, "en")} cm, one piece is at most ${cmText(cfg.maxPieceWidthMm, "en")} cm. Split the line or make the letters smaller.`) });
    }
  }
  glyphs.forEach((line, index) => {
    if (line.missing.length) {
      out.push({ level: "error", code: "missing-glyphs", lineIndex: index, message: t(
        `Рядок ${index + 1}: у шрифті немає символів ${line.missing.join(" ")}. Оберіть інший шрифт.`,
        `Строка ${index + 1}: в шрифте нет символов ${line.missing.join(" ")}. Выберите другой шрифт.`,
        `Line ${index + 1}: the font has no ${line.missing.join(" ")}. Pick another font.`) });
    }
    if (line.loose.length) {
      out.push({ level: "warning", code: "loose-parts", lineIndex: index, message: t(
        `Рядок ${index + 1}: у ${line.loose.join(" ")} є частини, що не дістають планки (крапки, знаки над літерами). Їх виріжемо окремо, вони клеяться на стіну поруч.`,
        `Строка ${index + 1}: у ${line.loose.join(" ")} есть части, которые не достают планки (точки, знаки над буквами). Их вырежем отдельно, они клеятся на стену рядом.`,
        `Line ${index + 1}: ${line.loose.join(" ")} have parts that do not reach the strip (dots, accents). They are cut separately and glued next to the letters.`) });
    }
  });
  return out;
}
