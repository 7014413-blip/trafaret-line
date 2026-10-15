// What the buyer typed → clean monogram input. Initials: one letter (Ukrainian, Russian or
// Latin), shown in capitals. Date: digits, dots, slashes, dashes and spaces, up to 12 signs.

import type { MonogramField, MonogramInput, MonogramInputCheck } from "../../types/monogram";
import { MONOGRAM_CONFIG } from "./config";

const LETTER = /^[A-Za-zА-ЩЬЮЯЄІЇҐа-щьюяєіїґЁёЫыЭэЪъ]$/u;
const DATE = /^[0-9.\/\- ]+$/;

function cleanInitial(raw: string): string {
  return [...raw.trim()].slice(0, MONOGRAM_CONFIG.initialMaxLength).join("").toLocaleUpperCase("uk-UA");
}

function cleanDate(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MONOGRAM_CONFIG.dateMaxLength);
}

/** Checks only the fields the chosen design uses. */
export function checkMonogramInput(raw: MonogramInput, fields: ReadonlyArray<MonogramField>): MonogramInputCheck {
  const value: MonogramInput = { first: cleanInitial(raw.first), second: cleanInitial(raw.second), date: cleanDate(raw.date) };
  const errors: MonogramInputCheck["errors"] = {};
  for (const field of fields) {
    if (field === "date") {
      if (!value.date) errors.date = "Вкажіть дату";
      else if (!DATE.test(value.date)) errors.date = "Лише цифри та крапки, наприклад 27.09.2026";
    } else if (!value[field]) {
      errors[field] = "Вкажіть літеру";
    } else if (!LETTER.test(value[field])) {
      errors[field] = "Одна літера: українська, російська або латинська";
    }
  }
  return { value, errors };
}
