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
  en: {
    line: (n) => `Line ${n}`,
    removeLine: (n) => `Remove line ${n}`,
    font: "Font",
    letterSize: "Letter size",
    sizeSteps: ["Small", "Medium", "Large", "Largest"],
    capHeight: (cm) => `Capital letter height ≈ ${cm} cm`,
    addLine: "+ Add line",
    text: "Text",
    size: "Size",
    ownSize: "Custom size",
    priceAtOnce: "instant price",
    widthCm: "Width, cm",
    heightCm: "Height, cm",
    diameterCm: "Diameter, cm",
    sizeRange: (minW, maxW, minH, maxH) => `Width from ${minW} to ${maxW} cm, height from ${minH} to ${maxH} cm.`,
    logo: "Logo",
    logoFile: "Logo file",
    replace: "Replace",
    remove: "Remove",
    addLogo: "Add logo",
    logoInvert: "Light logo on a dark background",
    letterHeight: "Letter height",
    ownHeightCm: "Custom height, cm",
    material: "Material",
    colour: "Color",
    acrylicColour: "Acrylic color",
    base: "Base",
    toOrder: " · made to order",
    toOrderShort: "to order",
    materialOf: (legend) => `${legend}: material`,
    colourOf: (legend) => `${legend}: color`,
    pointerGroups: { acrylic: "Acrylic", mirror: "Mirror acrylic", polystyrene: "Polystyrene" },
    setsQuantity: "Number of sets",
    setsShort: "sets",
    managerConfirms: "a manager will confirm the lead time",
    piecesShort: "pcs",
    wholeSet: (w, h) => `Whole set ≈ ${w} × ${h} cm`,
    emptyDesign: "Add text or a logo.",
    missingChars: (chars) => `The font has no characters: ${chars}. Choose another font.`,
    sheetThickness: (sheet, mm) => `${sheet}, ${mm} mm`,
    logoErrors: {
      "Підходять файли SVG, PNG або JPG.": "SVG, PNG or JPG files only.",
      "Підходять файли SVG, PDF, PNG або JPG.": "SVG, PDF, PNG or JPG files only.",
      "Файл більший за 10 МБ. Стисніть його або надішліть нам у Viber.": "The file is larger than 10 MB. Compress it or send it to us on Viber.",
      "Файл SVG пошкоджений. Збережіть логотип ще раз.": "The SVG file is damaged. Save the logo again.",
      "Не вдалося відкрити картинку. Спробуйте інший файл.": "Could not open the image. Try another file.",
      "Файл PDF пошкоджений. Збережіть логотип ще раз.": "The PDF file is damaged. Save the logo again.",
      "Не вдалося відкрити PDF. Збережіть логотип як SVG або PNG.": "Could not open the PDF. Save the logo as SVG or PNG.",
      "Не вдалося завантажити логотип. Спробуйте ще раз.": "Could not upload the logo. Please try again.",
      "Не вдалося завантажити файл. Спробуйте ще раз.": "Could not upload the file. Please try again.",
      "Не вдалося завантажити приклад. Додайте свій логотип.": "Could not load the sample. Add your own logo.",
    },
    onWall: "On the wall",
    close: "Close-up",
  },
};
