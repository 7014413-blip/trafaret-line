// Texts the sign, plaque and letter constructors share: text lines, sizes, logo, letter height,
// colour pickers and the words every constructor repeats. Each constructor keeps its own texts in
// a dictionary next to this one (signage-*.ts).

import type { Dictionary } from "../../../types/i18n";

export interface SignageTexts {
  // Text lines.
  line: (n: number) => string;
  removeLine: (n: number) => string;
  font: string;
  letterSize: string;
  sizeSteps: [string, string, string, string];
  capHeight: (cm: string) => string;
  addLine: string;
  text: string;
  // Size.
  size: string;
  ownSize: string;
  priceAtOnce: string;
  widthCm: string;
  heightCm: string;
  diameterCm: string;
  sizeRange: (minW: string, maxW: string, minH: string, maxH: string) => string;
  // Logo.
  logo: string;
  logoFile: string;
  replace: string;
  remove: string;
  addLogo: string;
  logoInvert: string;
  // Letter height.
  letterHeight: string;
  ownHeightCm: string;
  // Colours and materials.
  material: string;
  colour: string;
  acrylicColour: string;
  base: string;
  toOrder: string;
  toOrderShort: string;
  materialOf: (legend: string) => string;
  colourOf: (legend: string) => string;
  pointerGroups: Record<"acrylic" | "mirror" | "polystyrene", string>;
  // Repeated words.
  setsQuantity: string;
  setsShort: string;
  managerConfirms: string;
  piecesShort: string;
  wholeSet: (w: string, h: string) => string;
  emptyDesign: string;
  missingChars: (chars: string) => string;
  sheetThickness: (sheet: string, mm: number) => string;
  /** Errors of a logo upload written by the shop in Ukrainian; Ukrainian → this language. */
  logoErrors: Record<string, string>;
  // Previews.
  onWall: string;
  close: string;
}

export const SIGNAGE: Dictionary<SignageTexts> = {
  uk: {
    line: (n) => `Рядок ${n}`,
    removeLine: (n) => `Прибрати рядок ${n}`,
    font: "Шрифт",
    letterSize: "Розмір літер",
    sizeSteps: ["Малий", "Середній", "Великий", "Найбільший"],
    capHeight: (cm) => `Висота великих літер ≈ ${cm} см`,
    addLine: "+ Додати рядок",
    text: "Напис",
    size: "Розмір",
    ownSize: "Свій розмір",
    priceAtOnce: "ціна одразу",
    widthCm: "Ширина, см",
    heightCm: "Висота, см",
    diameterCm: "Діаметр, см",
    sizeRange: (minW, maxW, minH, maxH) => `Ширина від ${minW} до ${maxW} см, висота від ${minH} до ${maxH} см.`,
    logo: "Логотип",
    logoFile: "Файл логотипа",
    replace: "Замінити",
    remove: "Прибрати",
    addLogo: "Додати логотип",
    logoInvert: "Світлий логотип на темному фоні",
    letterHeight: "Висота літер",
    ownHeightCm: "Своя висота, см",
    material: "Матеріал",
    colour: "Колір",
    acrylicColour: "Колір акрилу",
    base: "Основа",
    toOrder: " · під замовлення",
    toOrderShort: "зам.",
    materialOf: (legend) => `${legend}: матеріал`,
    colourOf: (legend) => `${legend}: колір`,
    pointerGroups: { acrylic: "Акрил", mirror: "Дзеркальний акрил", polystyrene: "Полістирол" },
    setsQuantity: "Кількість наборів",
    setsShort: "наб.",
    managerConfirms: "менеджер підтвердить строк",
    piecesShort: "дет.",
    wholeSet: (w, h) => `Весь набір ≈ ${w} × ${h} см`,
    emptyDesign: "Додайте напис або логотип.",
    missingChars: (chars) => `У шрифті немає символів: ${chars}. Оберіть інший шрифт.`,
    sheetThickness: (sheet, mm) => `${sheet}, ${mm} мм`,
    logoErrors: {},
    onWall: "На стіні",
    close: "Крупно",
  },
  ru: {
    line: (n) => `Строка ${n}`,
    removeLine: (n) => `Убрать строку ${n}`,
    font: "Шрифт",
    letterSize: "Размер букв",
    sizeSteps: ["Маленький", "Средний", "Большой", "Самый большой"],
    capHeight: (cm) => `Высота заглавных букв ≈ ${cm} см`,
    addLine: "+ Добавить строку",
    text: "Надпись",
    size: "Размер",
    ownSize: "Свой размер",
    priceAtOnce: "цена сразу",
    widthCm: "Ширина, см",
    heightCm: "Высота, см",
    diameterCm: "Диаметр, см",
    sizeRange: (minW, maxW, minH, maxH) => `Ширина от ${minW} до ${maxW} см, высота от ${minH} до ${maxH} см.`,
    logo: "Логотип",
    logoFile: "Файл логотипа",
    replace: "Заменить",
    remove: "Убрать",
    addLogo: "Добавить логотип",
    logoInvert: "Светлый логотип на тёмном фоне",
    letterHeight: "Высота букв",
    ownHeightCm: "Своя высота, см",
    material: "Материал",
    colour: "Цвет",
    acrylicColour: "Цвет акрила",
    base: "Основа",
    toOrder: " · под заказ",
    toOrderShort: "зак.",
    materialOf: (legend) => `${legend}: материал`,
    colourOf: (legend) => `${legend}: цвет`,
    pointerGroups: { acrylic: "Акрил", mirror: "Зеркальный акрил", polystyrene: "Полистирол" },
    setsQuantity: "Количество наборов",
    setsShort: "наб.",
    managerConfirms: "менеджер подтвердит срок",
    piecesShort: "дет.",
    wholeSet: (w, h) => `Весь набор ≈ ${w} × ${h} см`,
    emptyDesign: "Добавьте надпись или логотип.",
    missingChars: (chars) => `В шрифте нет символов: ${chars}. Выберите другой шрифт.`,
    sheetThickness: (sheet, mm) => `${sheet}, ${mm} мм`,
    logoErrors: {
      "Підходять файли SVG, PNG або JPG.": "Подходят файлы SVG, PNG или JPG.",
      "Підходять файли SVG, PDF, PNG або JPG.": "Подходят файлы SVG, PDF, PNG или JPG.",
      "Файл більший за 10 МБ. Стисніть його або надішліть нам у Viber.": "Файл больше 10 МБ. Сожмите его или пришлите нам в Viber.",
      "Файл SVG пошкоджений. Збережіть логотип ще раз.": "Файл SVG повреждён. Сохраните логотип ещё раз.",
      "Не вдалося відкрити картинку. Спробуйте інший файл.": "Не удалось открыть картинку. Попробуйте другой файл.",
      "Файл PDF пошкоджений. Збережіть логотип ще раз.": "Файл PDF повреждён. Сохраните логотип ещё раз.",
      "Не вдалося відкрити PDF. Збережіть логотип як SVG або PNG.": "Не удалось открыть PDF. Сохраните логотип как SVG или PNG.",
      "Не вдалося завантажити логотип. Спробуйте ще раз.": "Не удалось загрузить логотип. Попробуйте ещё раз.",
      "Не вдалося завантажити файл. Спробуйте ще раз.": "Не удалось загрузить файл. Попробуйте ещё раз.",
      "Не вдалося завантажити приклад. Додайте свій логотип.": "Не удалось загрузить пример. Добавьте свой логотип.",
    },
    onWall: "На стене",
    close: "Крупно",
  },
};
