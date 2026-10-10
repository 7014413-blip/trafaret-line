// Fixes number–noun agreement in catalogue texts, e.g. «21 дизайнів» → «21 дизайн»,
// «3 трафаретів» → «3 трафарети» (QA 2026-10-10, m11). The catalogue import writes counts
// into headings with one fixed form; the storefront corrects them when mapping.

import { pluralUk } from "./plural-uk";

const NOUNS: readonly (readonly [string, string, string])[] = [
  ["дизайн", "дизайни", "дизайнів"],
  ["трафарет", "трафарети", "трафаретів"],
  ["малюнок", "малюнки", "малюнків"],
  ["варіант", "варіанти", "варіантів"],
  ["розмір", "розміри", "розмірів"],
  ["товар", "товари", "товарів"],
  ["шаблон", "шаблони", "шаблонів"],
  ["візерунок", "візерунки", "візерунків"],
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PATTERNS = NOUNS.map((forms) => ({
  forms,
  // Longest form first so «дизайнів» is not matched as «дизайн».
  re: new RegExp(`(\\d+)(\\s|\\u00a0)(${[...forms].sort((a, b) => b.length - a.length).map(escape).join("|")})(?![\\p{L}])`, "gu"),
}));

export function fixCountAgreement(text: string): string {
  let out = text;
  for (const { forms, re } of PATTERNS) {
    out = out.replace(re, (_m, n: string, space: string) => `${n}${space}${pluralUk(Number(n), forms as [string, string, string])}`);
  }
  return out;
}
