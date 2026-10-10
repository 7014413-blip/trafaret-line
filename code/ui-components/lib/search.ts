// Search helpers shared by SpotlightSearch and the server.
// Production: Meilisearch (typos, ranking, synonyms on the index). This module adds
// what Meilisearch does not do (Latin → Cyrillic transliteration, uk/ru folding) and a
// local fallback search for development and for small lists (categories, fonts).

import type { ProductHit } from "../types/customizer";

const TR: [string, string][] = [
  ["shch", "щ"], ["sch", "щ"], ["zh", "ж"], ["kh", "х"], ["ts", "ц"], ["ch", "ч"], ["sh", "ш"],
  ["yu", "ю"], ["ya", "я"], ["ye", "є"], ["yi", "ї"],
  ["a", "а"], ["b", "б"], ["v", "в"], ["h", "г"], ["g", "г"], ["d", "д"], ["e", "е"], ["z", "з"], ["y", "и"],
  ["i", "і"], ["j", "й"], ["k", "к"], ["l", "л"], ["m", "м"], ["n", "н"], ["o", "о"], ["p", "п"], ["r", "р"],
  ["s", "с"], ["t", "т"], ["u", "у"], ["f", "ф"], ["c", "к"], ["w", "в"], ["x", "кс"], ["q", "к"],
];

/** "trafaret sertse" → "трафарет серце". */
export function translit(s: string): string {
  let out = "";
  const low = s.toLowerCase();
  for (let i = 0; i < low.length;) {
    const m = TR.find(([l]) => low.startsWith(l, i));
    if (m) { out += m[1]; i += m[0].length; } else { out += low[i]; i += 1; }
  }
  return out;
}

/** Latin word that is not a SKU like "TL-M-0101". */
export const isLatinWord = (s: string) => /[a-z]{3,}/i.test(s) && !/^[a-z]{1,4}-[a-z]?-?\d/i.test(s);

/**
 * Folds Ukrainian and Russian spelling into one form so "подъезд" finds "підʼїзд"
 * and "кофе" finds "кава" (via SYNONYMS). Use for the local fallback only; on
 * Meilisearch the same folding is a synonyms list.
 */
export function fold(s: string): string {
  return s.toLowerCase()
    .replace(/[ʼ'’`"«»]/g, "")
    .replace(/[їіиыйі]/g, "і").replace(/[єеэё]/g, "е").replace(/ґ/g, "г")
    .replace(/[‐-―]/g, "-").replace(/\s+/g, " ").trim();
}

/** Seed synonyms (uk/ru/en/slang). Same list is pushed to Meilisearch settings. */
export const SYNONYMS: Record<string, string[]> = {
  "кава": ["кофе", "капучино", "латте", "бариста", "кавʼярня", "кофейня", "coffee", "latte"],
  "торт": ["кондитер", "крем", "какао", "пудра", "для торта", "cake", "bakery"],
  "підʼїзд": ["подъезд", "осбб", "номер будинку", "house number"],
  "цегла": ["кирпич", "кладка", "лофт", "brick"],
  "маркування": ["маркировка", "гост", "дсту", "iso", "marking"],
  "вантаж": ["груз", "склад", "тара", "cargo"],
  "серце": ["сердце", "сердечко", "heart"],
  "напис": ["надпись", "текст", "имя", "імʼя", "lettering", "name"],
};

function expand(token: string): string[] {
  const f = fold(token);
  const out = new Set([f]);
  for (const [head, list] of Object.entries(SYNONYMS)) {
    const all = [head, ...list].map(fold);
    if (all.some((w) => w.startsWith(f) || f.startsWith(w))) all.forEach((w) => out.add(w));
  }
  return [...out];
}

/** Compact form for codes: "ГОСТ 14192-96" and "гост14192" match the same. */
const compact = (s: string) => fold(s).replace(/[\s\-.]/g, "");

/**
 * Local search over product hits: every query word must match the title, SKU,
 * standards or category (after folding, synonyms and transliteration).
 * Ranking: SKU/standard exact > title start > anywhere.
 */
export function localSearch(items: ProductHit[], query: string, limit = 6): ProductHit[] {
  const q = query.trim();
  if (!q) return [];
  const words = q.split(/\s+/).flatMap((w) => (isLatinWord(w) ? [w, translit(w)] : [w]));
  const groups = q.split(/\s+/).map((w) => [...expand(w), ...(isLatinWord(w) ? expand(translit(w)) : [])]);
  const codeQ = compact(q);

  const scored = items.map((p) => {
    const hay = fold([p.title, p.sku, ...(p.standards ?? []), p.categoryTitle].join(" "));
    const codes = [p.sku, ...(p.standards ?? [])].map(compact);
    let score = 0;
    if (codes.some((c) => c === codeQ)) score += 100;
    else if (codes.some((c) => c.includes(codeQ) && codeQ.length >= 3)) score += 60;
    if (groups.every((g) => g.some((w) => hay.includes(w)))) score += 20;
    if (words.some((w) => fold(p.title).startsWith(fold(w)))) score += 10;
    return { p, score };
  });
  return scored.filter((x) => x.score >= 20).sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.p);
}
