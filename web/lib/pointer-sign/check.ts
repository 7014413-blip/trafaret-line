// Checks of a pointer sign before it goes to the cart (the server repeats the size and price
// checks; letter sizes come from the same layout). Messages in uk / ru / en.

import type { LocalizedText } from "../../types/customizer";
import type { PointerSignCheck, PointerSignConfig, PointerSignDesign, PointerSignLayout } from "../../types/pointer-sign";
import { DEFAULT_POINTER_SIGN_CONFIG } from "./config";
import { findPointerMaterial } from "./find-material";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });
const mm = (v: number) => v.toLocaleString("uk-UA", { maximumFractionDigits: 1 });

export function checkPointerSign(
  design: PointerSignDesign, layout: PointerSignLayout, missingGlyphs: string[][] = [], cfg: PointerSignConfig = DEFAULT_POINTER_SIGN_CONFIG,
): PointerSignCheck[] {
  const out: PointerSignCheck[] = [];
  const base = findPointerMaterial(design.baseMaterialId);
  const overlay = findPointerMaterial(design.overlayMaterialId);

  if (!layout.lines.length && !design.logo && !layout.arrow) {
    out.push({ level: "error", code: "empty", message: t("Додайте напис, стрілку або логотип.", "Добавьте надпись, стрелку или логотип.", "Add text, an arrow or a logo.") });
  }

  for (const line of layout.lines) {
    const n = line.index + 1;
    if (line.capMm < cfg.absoluteMinLetterMm) {
      out.push({
        level: "error", code: "letters-too-small", lineIndex: line.index,
        message: t(
          `Рядок ${n}: літери ${mm(line.capMm)} мм, так дрібно не виріжемо. Скоротіть текст, приберіть рядок або візьміть більший розмір.`,
          `Строка ${n}: буквы ${mm(line.capMm)} мм, так мелко не вырежем. Сократите текст, уберите строку или возьмите больший размер.`,
          `Line ${n}: letters are ${mm(line.capMm)} mm, too small to cut. Shorten the text, drop a line or pick a larger size.`,
        ),
      });
    } else if (line.capMm < overlay.minLetterMm) {
      out.push({
        level: "warning", code: "letters-small", lineIndex: line.index,
        message: t(
          `Рядок ${n}: літери ${mm(line.capMm)} мм. Тонкі елементи менеджер перевірить і за потреби трохи потовщить.`,
          `Строка ${n}: буквы ${mm(line.capMm)} мм. Тонкие элементы менеджер проверит и при необходимости немного утолщит.`,
          `Line ${n}: letters are ${mm(line.capMm)} mm. A manager checks thin parts and thickens them a little if needed.`,
        ),
      });
    }
  }

  missingGlyphs.forEach((chars, index) => {
    if (!chars.length || !design.lines[index]?.text.trim()) return;
    out.push({
      level: "warning", code: "missing-glyphs", lineIndex: index,
      message: t(
        `Рядок ${index + 1}: у шрифті немає символів ${chars.join(" ")}. Оберіть інший шрифт.`,
        `Строка ${index + 1}: в шрифте нет символов ${chars.join(" ")}. Выберите другой шрифт.`,
        `Line ${index + 1}: the font has no ${chars.join(" ")}. Pick another font.`,
      ),
    });
  });

  for (const sheet of [base, overlay]) {
    if (!sheet.inStock) {
      out.push({ level: "warning", code: "out-of-stock", message: t(`${sheet.name.uk} під замовлення: менеджер підтвердить строк.`, `${sheet.name.ru} под заказ: менеджер подтвердит срок.`, `${sheet.name.en} is made to order: a manager confirms the lead time.`) });
    }
  }
  if (base.id === overlay.id || base.hex.toLowerCase() === overlay.hex.toLowerCase()) {
    out.push({ level: "warning", code: "same-colour", message: t("Основа і напис одного кольору: напис буде видно лише за обʼємом.", "Основа и надпись одного цвета: надпись будет видна только за счёт объёма.", "Base and text have the same colour: the text shows only by its relief.") });
  }
  if (design.logo?.format === "raster") {
    out.push({ level: "warning", code: "raster-logo", message: t("Логотип з картинки переведемо у вектор і надішлемо макет на погодження перед порізкою.", "Логотип из картинки переведём в вектор и пришлём макет на согласование перед резкой.", "We trace the logo picture and send the layout for approval before cutting.") });
  }
  return out;
}
