// Lines of the price breakdown that the signage, plaque and letter calculators show under the
// total, in every site language. Shared with the server, so only relative imports. The server
// prices in Ukrainian; the constructors pass the page language.

import type { Locale } from "../../../types/customizer";
import type { Dictionary } from "../../../types/i18n";
import { pluralUk } from "../../text/plural-uk";
import { tr } from "../translate";

export interface PriceLineTexts {
  size: (w: string, h: string, own: boolean) => string;
  /** Discount names written by lib/calculators/pricing.ts; Ukrainian → this language. */
  discounts: Record<string, string>;
  pieces: (n: number) => string;
  rows: (n: number) => string;
  plaques: (n: number) => string;
  // Pointer sign.
  pointerBase: (material: string, mm: number) => string;
  pointerText: (material: string, mm: number) => string;
  pointerLogo: string;
  // Wedding initials.
  initialsWhole: (w: string, h: string, letters: string) => string;
  initialsTopper: string;
  initialsPieces: (pieces: string) => string;
  // Words on a bar.
  wordsLongest: (longest: string, w: string, h: string) => string;
  // Two-layer plaques.
  numberLayers: (face: string, back: string) => string;
  plaqueLayers: (base: string, frame: boolean, overlay: string) => string;
  plaqueSeries: (from: number, to: number, plaques: string, price: number) => string;
  // Letters.
  lettersWhole: (pieces: string, w: string, h: string) => string;
  lettersSheet: (sheet: string, mm: number, adhesive: boolean) => string;
  lettersStencil: string;
  // Office plaque.
  officeLayers: (base: string, plate: string) => string;
  office3m: string;
  // Business sign.
  signBase: (size: string, sheet: string, mm: number) => string;
  signLayers: (n: number) => string;
  signThicker: (mm: number, included: number) => string;
  signHoles: (n: number) => string;
  signLogoDevelopment: string;
  signStencil: string;
  signAdhesiveIncluded: string;
  signAdhesive: string;
  signMinimum: (price: number) => string;
  signLogo: string;
  signLayer: (text: string, w: string, h: string, sheet: string) => string;
  lettersMinimum: (price: number) => string;
  whiteLabel: string;
}

export const PRICE_LINES: Dictionary<PriceLineTexts> = {
  uk: {
    size: (w, h, own) => `Розмір ${w} × ${h} см${own ? " (свій)" : ""}`,
    discounts: {},
    pieces: (n) => `${n} ${pluralUk(n, ["деталь", "деталі", "деталей"])}`,
    rows: (n) => `${n} ${pluralUk(n, ["рядок", "рядки", "рядків"])}`,
    plaques: (n) => `${n} ${pluralUk(n, ["табличка", "таблички", "табличок"])}`,
    pointerBase: (material, mm) => `Основа: ${material} ${mm} мм`,
    pointerText: (material, mm) => `Напис: ${material} ${mm} мм, усі кольори вже в ціні`,
    pointerLogo: "Логотип: без доплати, макет погодимо перед порізкою",
    initialsWhole: (w, h, letters) => `Уся композиція ${w} × ${h} см, літери ${letters} см`,
    initialsTopper: "Одним топпером на планці зі шпажкою",
    initialsPieces: (pieces) => `${pieces}, кладуться на торт`,
    wordsLongest: (longest, w, h) => `Найдовша деталь ${longest} см, весь набір ${w} × ${h} см`,
    numberLayers: (face, back) => `Лицьовий шар ${face}, нижній ${back}, клейова основа`,
    plaqueLayers: (base, frame, overlay) => `Основа ${base}, напис${frame ? " і рамка" : ""}: ${overlay}`,
    plaqueSeries: (from, to, plaques, price) => `Номери ${from}–${to}: ${plaques} по ${price} ₴`,
    lettersWhole: (pieces, w, h) => `${pieces}, увесь напис ${w} × ${h} см`,
    lettersSheet: (sheet, mm, adhesive) => `${sheet}, ${mm} мм, ${adhesive ? "самоклейка на звороті" : "без самоклейки"}`,
    lettersStencil: "Картонний трафарет для рівної поклейки, у ціні",
    officeLayers: (base, plate) => `Основа ${base}, пластина ${plate} з гравіюванням`,
    office3m: "Клейова основа 3M уже в ціні",
    signBase: (size, sheet, mm) => `${size}, ${sheet} ${mm} мм`,
    signLayers: (n) => `Шарів: ${n}, усі кольори й матеріали вже в ціні`,
    signThicker: (mm, included) => `Основа ${mm} мм замість ${included} мм`,
    signHoles: (n) => `Отвори під кріплення: ${n}`,
    signLogoDevelopment: "Розробка вашого логотипа, у ціні",
    signStencil: "Монтажний трафарет",
    signAdhesiveIncluded: "Самоклейка на звороті, у ціні",
    signAdhesive: "Самоклейка на звороті",
    signMinimum: (price) => `Мінімальна вартість вивіски ${price} грн`,
    signLogo: "Логотип",
    signLayer: (text, w, h, sheet) => `${text}: ${w} × ${h} мм, ${sheet}`,
    lettersMinimum: (price) => `Мінімальна вартість замовлення ${price} грн`,
    whiteLabel: "Без нашого бренду (white-label)",
  },
  ru: {
    size: (w, h, own) => `Размер ${w} × ${h} см${own ? " (свой)" : ""}`,
    discounts: {
      "Опт за кількість": "Опт по количеству",
      "Великий формат": "Большой формат",
      "Постійний клієнт": "Постоянный клиент",
      "Перше замовлення": "Первый заказ",
      "Оптова програма": "Оптовая программа",
      "Оптова ціна": "Оптовая цена",
    },
    pieces: (n) => `${n} ${pluralUk(n, ["деталь", "детали", "деталей"])}`,
    rows: (n) => `${n} ${pluralUk(n, ["строка", "строки", "строк"])}`,
    plaques: (n) => `${n} ${pluralUk(n, ["табличка", "таблички", "табличек"])}`,
    pointerBase: (material, mm) => `Основа: ${material} ${mm} мм`,
    pointerText: (material, mm) => `Надпись: ${material} ${mm} мм, все цвета уже в цене`,
    pointerLogo: "Логотип: без доплаты, макет согласуем перед порезкой",
    initialsWhole: (w, h, letters) => `Вся композиция ${w} × ${h} см, буквы ${letters} см`,
    initialsTopper: "Одним топпером на планке со шпажкой",
    initialsPieces: (pieces) => `${pieces}, кладутся на торт`,
    wordsLongest: (longest, w, h) => `Самая длинная деталь ${longest} см, весь набор ${w} × ${h} см`,
    numberLayers: (face, back) => `Лицевой слой ${face}, нижний ${back}, клеевая основа`,
    plaqueLayers: (base, frame, overlay) => `Основа ${base}, надпись${frame ? " и рамка" : ""}: ${overlay}`,
    plaqueSeries: (from, to, plaques, price) => `Номера ${from}–${to}: ${plaques} по ${price} ₴`,
    lettersWhole: (pieces, w, h) => `${pieces}, вся надпись ${w} × ${h} см`,
    lettersSheet: (sheet, mm, adhesive) => `${sheet}, ${mm} мм, ${adhesive ? "самоклейка на обороте" : "без самоклейки"}`,
    lettersStencil: "Картонный трафарет для ровной поклейки, в цене",
    officeLayers: (base, plate) => `Основа ${base}, пластина ${plate} с гравировкой`,
    office3m: "Клеевая основа 3M уже в цене",
    signBase: (size, sheet, mm) => `${size}, ${sheet} ${mm} мм`,
    signLayers: (n) => `Слоёв: ${n}, все цвета и материалы уже в цене`,
    signThicker: (mm, included) => `Основа ${mm} мм вместо ${included} мм`,
    signHoles: (n) => `Отверстия под крепёж: ${n}`,
    signLogoDevelopment: "Разработка вашего логотипа, в цене",
    signStencil: "Монтажный трафарет",
    signAdhesiveIncluded: "Самоклейка на обороте, в цене",
    signAdhesive: "Самоклейка на обороте",
    signMinimum: (price) => `Минимальная стоимость вывески ${price} грн`,
    signLogo: "Логотип",
    signLayer: (text, w, h, sheet) => `${text}: ${w} × ${h} мм, ${sheet}`,
    lettersMinimum: (price) => `Минимальная стоимость заказа ${price} грн`,
    whiteLabel: "Без нашего бренда (white-label)",
  },
  en: {
    size: (w, h, own) => `Size ${w} × ${h} cm${own ? " (custom)" : ""}`,
    discounts: {
      "Опт за кількість": "Bulk quantity",
      "Великий формат": "Large format",
      "Постійний клієнт": "Regular customer",
      "Перше замовлення": "First order",
      "Оптова програма": "Wholesale program",
      "Оптова ціна": "Wholesale price",
    },
    pieces: (n) => (n === 1 ? "1 piece" : `${n} pieces`),
    rows: (n) => (n === 1 ? "1 line" : `${n} lines`),
    plaques: (n) => (n === 1 ? "1 plaque" : `${n} plaques`),
    pointerBase: (material, mm) => `Base: ${material} ${mm} mm`,
    pointerText: (material, mm) => `Text: ${material} ${mm} mm, all colors included in the price`,
    pointerLogo: "Logo: no extra charge, we approve the layout with you before cutting",
    initialsWhole: (w, h, letters) => `Whole composition ${w} × ${h} cm, letters ${letters} cm`,
    initialsTopper: "One cake topper on a bar with a stick",
    initialsPieces: (pieces) => `${pieces}, laid on the cake`,
    wordsLongest: (longest, w, h) => `Longest piece ${longest} cm, whole set ${w} × ${h} cm`,
    numberLayers: (face, back) => `Top layer ${face}, bottom layer ${back}, adhesive backing`,
    plaqueLayers: (base, frame, overlay) => `Base ${base}, text${frame ? " and frame" : ""}: ${overlay}`,
    plaqueSeries: (from, to, plaques, price) => `Numbers ${from}–${to}: ${plaques} at ${price} ₴`,
    lettersWhole: (pieces, w, h) => `${pieces}, whole lettering ${w} × ${h} cm`,
    lettersSheet: (sheet, mm, adhesive) => `${sheet}, ${mm} mm, ${adhesive ? "self-adhesive back" : "no adhesive"}`,
    lettersStencil: "Cardboard mounting template for even placement, included",
    officeLayers: (base, plate) => `Base ${base}, engraved ${plate} plate`,
    office3m: "3M adhesive backing included in the price",
    signBase: (size, sheet, mm) => `${size}, ${sheet} ${mm} mm`,
    signLayers: (n) => `Layers: ${n}, all colors and materials included in the price`,
    signThicker: (mm, included) => `Base ${mm} mm instead of ${included} mm`,
    signHoles: (n) => `Mounting holes: ${n}`,
    signLogoDevelopment: "Design of your logo, included",
    signStencil: "Mounting template",
    signAdhesiveIncluded: "Self-adhesive back, included",
    signAdhesive: "Self-adhesive back",
    signMinimum: (price) => `Minimum sign price ${price} UAH`,
    signLogo: "Logo",
    signLayer: (text, w, h, sheet) => `${text}: ${w} × ${h} mm, ${sheet}`,
    lettersMinimum: (price) => `Minimum order ${price} UAH`,
    whiteLabel: "Without our brand (white-label)",
  },
};

/** Texts of the breakdown in this language. */
export function priceLines(locale: Locale): PriceLineTexts {
  return tr(PRICE_LINES, locale);
}

/** «Опт за кількість: −5%» in this language; a promo code keeps its own name. */
export function discountLine(label: string, value: number, locale: Locale): string {
  return `${priceLines(locale).discounts[label] ?? label}: −${Math.round(value * 100)}%`;
}
