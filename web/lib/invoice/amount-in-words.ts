// Amount in Ukrainian words for invoices: 1285.5 → «Одна тисяча двісті вісімдесят
// п'ять гривень 50 копійок». Hryvnia is feminine (одна, дві), thousand is feminine,
// million and billion are masculine (один, два).

const ONES_M = ["", "один", "два", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"];
const ONES_F = ["", "одна", "дві", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"];
const TEENS = ["десять", "одинадцять", "дванадцять", "тринадцять", "чотирнадцять", "п'ятнадцять", "шістнадцять", "сімнадцять", "вісімнадцять", "дев'ятнадцять"];
const TENS = ["", "", "двадцять", "тридцять", "сорок", "п'ятдесят", "шістдесят", "сімдесят", "вісімдесят", "дев'яносто"];
const HUNDREDS = ["", "сто", "двісті", "триста", "чотириста", "п'ятсот", "шістсот", "сімсот", "вісімсот", "дев'ятсот"];

type Forms = [one: string, few: string, many: string];

const HRYVNIA: Forms = ["гривня", "гривні", "гривень"];
const KOPIYKA: Forms = ["копійка", "копійки", "копійок"];
const SCALES: { forms: Forms; feminine: boolean }[] = [
  { forms: ["", "", ""], feminine: true },
  { forms: ["тисяча", "тисячі", "тисяч"], feminine: true },
  { forms: ["мільйон", "мільйони", "мільйонів"], feminine: false },
  { forms: ["мільярд", "мільярди", "мільярдів"], feminine: false },
];

/** Plural form for a number: 1 гривня, 2 гривні, 5 гривень, 11 гривень, 21 гривня. */
export function pluralForm(n: number, forms: Forms): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

/** Words for 1…999. */
function triadWords(n: number, feminine: boolean): string[] {
  const words: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) words.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) {
    words.push(TEENS[rest - 10]);
  } else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (t) words.push(TENS[t]);
    if (o) words.push((feminine ? ONES_F : ONES_M)[o]);
  }
  return words;
}

/** Whole number in words with the noun of the given gender in the units place. */
export function integerWords(value: number, unitsFeminine = true): string {
  if (value === 0) return "нуль";
  const parts: string[] = [];
  let rest = Math.floor(value);
  let scale = 0;
  while (rest > 0 && scale < SCALES.length) {
    const triad = rest % 1000;
    if (triad) {
      const feminine = scale === 0 ? unitsFeminine : SCALES[scale].feminine;
      const words = triadWords(triad, feminine);
      if (scale > 0) words.push(pluralForm(triad, SCALES[scale].forms));
      parts.unshift(words.join(" "));
    }
    rest = Math.floor(rest / 1000);
    scale += 1;
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** «Одна тисяча двісті вісімдесят п'ять гривень 50 копійок». */
export function amountInWords(amount: number): string {
  const kopecksTotal = Math.round(amount * 100);
  const hryvnias = Math.floor(kopecksTotal / 100);
  const kopecks = kopecksTotal % 100;
  const text = `${integerWords(hryvnias, true)} ${pluralForm(hryvnias, HRYVNIA)} ${String(kopecks).padStart(2, "0")} ${pluralForm(kopecks, KOPIYKA)}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
