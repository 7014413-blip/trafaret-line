// Texts of the «Заготовки» configurator. Shape, material and colour names come with the data
// (lib/blanks/shapes.ts, sheets.ts) in every language.

import type { Dictionary } from "../../../types/i18n";

export interface BlanksTexts {
  kicker: string;
  title: string;
  lead: string;
  schemeRegion: string;
  schemeLabel: (shape: string, size: string) => string;
  unitPrice: (price: string, discount: string) => string;
  pack: (qty: number, price: string) => string;
  shape: string;
  size: string;
  ownSize: string;
  priceAtOnce: string;
  diameterCm: string;
  widthCm: string;
  longerSideCm: string;
  heightCm: string;
  sizeRange: (min: string, max: string) => string;
  sizeBySide: string;
  material: string;
  thickness: string;
  colour: string;
  tierCaption: string;
  onePiece: string;
  fromQty: (qty: number) => string;
}

export const BLANKS: Dictionary<BlanksTexts> = {
  uk: {
    kicker: "Заготовки",
    title: "Заготовки з акрилу, дзеркального пластику і PET",
    lead: "Оберіть форму, розмір, матеріал і колір. Ріжемо лазером за 3 робочі дні, ціна за штуку одразу, опт від 10 шт.",
    schemeRegion: "Схема заготовки",
    schemeLabel: (shape, size) => `Схема заготовки «${shape}» ${size}`,
    unitPrice: (price, discount) => `Ціна за шт.: ${price}${discount}`,
    pack: (qty, price) => `Упаковка ${qty} шт.: ${price}`,
    shape: "Форма",
    size: "Розмір",
    ownSize: "Свій розмір",
    priceAtOnce: "ціна одразу",
    diameterCm: "Діаметр, см",
    widthCm: "Ширина, см",
    longerSideCm: "Більша сторона, см",
    heightCm: "Висота, см",
    sizeRange: (min, max) => `Від ${min} до ${max} см, з точністю до 1 мм.`,
    sizeBySide: " Розмір по більшій стороні фігури.",
    material: "Матеріал",
    thickness: "Товщина",
    colour: "Колір",
    tierCaption: "Ціна за штуку від кількості",
    onePiece: "1 шт.",
    fromQty: (qty) => `від ${qty} шт.`,
  },
  ru: {
    kicker: "Заготовки",
    title: "Заготовки из акрила, зеркального пластика и PET",
    lead: "Выберите форму, размер, материал и цвет. Режем лазером за 3 рабочих дня, цена за штуку сразу, опт от 10 шт.",
    schemeRegion: "Схема заготовки",
    schemeLabel: (shape, size) => `Схема заготовки «${shape}» ${size}`,
    unitPrice: (price, discount) => `Цена за шт.: ${price}${discount}`,
    pack: (qty, price) => `Упаковка ${qty} шт.: ${price}`,
    shape: "Форма",
    size: "Размер",
    ownSize: "Свой размер",
    priceAtOnce: "цена сразу",
    diameterCm: "Диаметр, см",
    widthCm: "Ширина, см",
    longerSideCm: "Большая сторона, см",
    heightCm: "Высота, см",
    sizeRange: (min, max) => `От ${min} до ${max} см, с точностью до 1 мм.`,
    sizeBySide: " Размер по большей стороне фигуры.",
    material: "Материал",
    thickness: "Толщина",
    colour: "Цвет",
    tierCaption: "Цена за штуку от количества",
    onePiece: "1 шт.",
    fromQty: (qty) => `от ${qty} шт.`,
  },
};
