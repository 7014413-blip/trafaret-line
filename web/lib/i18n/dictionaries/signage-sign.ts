// Texts of the business sign constructor (/vyvisky) and its preview. Words the sign, plaque and
// letter constructors share (font, size, logo, base, colour, previews) are in signage.ts.

import type { Dictionary } from "../../../types/i18n";

export interface SignageSignTexts {
  // Preview.
  previewRegion: string;
  previewLabel: (size: string) => string;
  onWallLabel: (label: string) => string;
  lettersFrom: (cm: string) => string;
  // Header.
  kicker: string;
  title: string;
  lead: string;
  /** Start text of the two example lines. */
  exampleLines: [string, string];
  links: Record<"pointer" | "office" | "joined" | "floors" | "doors" | "numbers", string>;
  // Shape and size.
  shapeSize: string;
  shapes: Record<"circle" | "rect" | "rounded" | "square" | "arrow" | "pointer", string>;
  left: string;
  right: string;
  // Base.
  baseColour: string;
  surcharge: string;
  // Logo.
  logoHint: string;
  trySample: string;
  sampleFailed: string;
  logoDevStrong: string;
  logoDevRest: string;
  logoBriefPlaceholder: string;
  logoDevNote: string;
  places: Record<"above" | "left", string>;
  logoSize: string;
  logoColour: string;
  logoRasterNote: string;
  logoSvgNote: string;
  // Text lines.
  lineColour: string;
  lineColourOf: (n: number) => string;
  // Text along the edge.
  arcLegend: string;
  arcToggle: string;
  arcTop: string;
  arcBottom: string;
  arcFont: string;
  arcColour: string;
  // Frame.
  frame: string;
  frameToggle: string;
  frameColour: string;
  // Mounting.
  mounting: string;
  adhesive: string;
  holes: Record<0 | 2 | 4, string>;
  template: string;
  // Link and cart.
  draftNoteLogo: string;
  draftNote: string;
  cartTitle: (texts: string, logo: "own" | "development" | null, size: string) => string;
}

export const SIGNAGE_SIGN: Dictionary<SignageSignTexts> = {
  uk: {
    previewRegion: "Превʼю вивіски",
    previewLabel: (size) => `Превʼю вивіски ${size}`,
    onWallLabel: (label) => `${label}, на стіні поруч з людиною зросту 1,75 м`,
    lettersFrom: (cm) => ` · літери від ${cm} см`,
    kicker: "Конструктор вивісок",
    title: "3D акрилова бізнес-вивіска",
    lead: "Персоналізована вивіска з акрилу у два шари: основа і обʼємний напис, ваш логотип, дзеркальна рамка. Немає логотипа — розробимо індивідуально. Кругла від Ø30 см за 1 600 ₴.",
    exampleLines: ["Мрія", "САЛОН КРАСИ"],
    links: {
      pointer: "Табличка-стрілка 25×10 см від 450 ₴ →",
      office: "Офісна табличка 21×6 см від 220 ₴ →",
      joined: "Написи на планці, меню з акрилу →",
      floors: "Таблички поверхів →",
      doors: "Таблички на двері →",
      numbers: "Номерки від 65 ₴ →",
    },
    shapeSize: "Форма і розмір",
    shapes: { circle: "Коло", rect: "Прямокутник", rounded: "Заокруглений", square: "Квадрат", arrow: "Стрілка", pointer: "Вказівник" },
    left: "← Ліворуч",
    right: "Праворуч →",
    baseColour: "Колір основи",
    surcharge: " · доплата",
    logoHint: "SVG, PDF, PNG або JPG до 10 МБ, без доплати",
    trySample: "Приміряти приклад логотипа",
    sampleFailed: "Не вдалося завантажити приклад. Додайте свій логотип.",
    logoDevStrong: "Немає логотипа? Розробимо індивідуально",
    logoDevRest: ", у ціні вивіски",
    logoBriefPlaceholder: "Назва, сфера, стиль, кольори, що подобається",
    logoDevNote: "Дизайнер намалює 2–3 варіанти і надішле вам на вибір перед виготовленням.",
    places: { above: "Над текстом", left: "Ліворуч від тексту" },
    logoSize: "Розмір логотипа",
    logoColour: "Колір логотипа",
    logoRasterNote: "Картинку переведемо у вектор і надішлемо макет на погодження перед порізкою. Логотип у кількох кольорах розкладемо по шарах.",
    logoSvgNote: "Перед порізкою надішлемо макет на погодження. Логотип у кількох кольорах розкладемо по шарах.",
    lineColour: "Колір рядка",
    lineColourOf: (n) => `Колір рядка ${n}`,
    arcLegend: "Текст по колу",
    arcToggle: "Напис уздовж краю, як на емблемі",
    arcTop: "Текст зверху",
    arcBottom: "Текст знизу",
    arcFont: "Шрифт тексту по колу",
    arcColour: "Колір тексту по колу",
    frame: "Рамка",
    frameToggle: "Рамка вздовж краю",
    frameColour: "Колір рамки",
    mounting: "Кріплення",
    adhesive: "Самоклейка на звороті",
    holes: { 0: "Без отворів", 2: "2 отвори з тримачами", 4: "4 отвори з тримачами" },
    template: "Монтажний трафарет для рівного кріплення (прорізи на 0,2 мм більші за деталі)",
    draftNoteLogo: "Логотип у посилання не потрапляє: на іншому пристрої додайте файл ще раз.",
    draftNote: "Відкриє цю саму вивіску на телефоні чи іншому компʼютері.",
    cartTitle: (texts, logo, size) =>
      `Вивіска${texts ? ` «${texts}»` : ""}${logo === "own" ? " з логотипом" : logo === "development" ? ", розробка логотипа" : ""}, ${size}`,
  },
  ru: {
    previewRegion: "Превью вывески",
    previewLabel: (size) => `Превью вывески ${size}`,
    onWallLabel: (label) => `${label}, на стене рядом с человеком ростом 1,75 м`,
    lettersFrom: (cm) => ` · буквы от ${cm} см`,
    kicker: "Конструктор вывесок",
    title: "3D акриловая бизнес-вывеска",
    lead: "Персонализированная вывеска из акрила в два слоя: основа и объёмная надпись, ваш логотип, зеркальная рамка. Нет логотипа — разработаем индивидуально. Круглая от Ø30 см за 1 600 ₴.",
    exampleLines: ["Мечта", "САЛОН КРАСОТЫ"],
    links: {
      pointer: "Табличка-стрелка 25×10 см от 450 ₴ →",
      office: "Офисная табличка 21×6 см от 220 ₴ →",
      joined: "Надписи на планке, меню из акрила →",
      floors: "Таблички этажей →",
      doors: "Таблички на двери →",
      numbers: "Номерки от 65 ₴ →",
    },
    shapeSize: "Форма и размер",
    shapes: { circle: "Круг", rect: "Прямоугольник", rounded: "Скруглённый", square: "Квадрат", arrow: "Стрелка", pointer: "Указатель" },
    left: "← Влево",
    right: "Вправо →",
    baseColour: "Цвет основы",
    surcharge: " · доплата",
    logoHint: "SVG, PDF, PNG или JPG до 10 МБ, без доплаты",
    trySample: "Примерить пример логотипа",
    sampleFailed: "Не удалось загрузить пример. Добавьте свой логотип.",
    logoDevStrong: "Нет логотипа? Разработаем индивидуально",
    logoDevRest: ", в цене вывески",
    logoBriefPlaceholder: "Название, сфера, стиль, цвета, что нравится",
    logoDevNote: "Дизайнер нарисует 2–3 варианта и пришлёт вам на выбор перед изготовлением.",
    places: { above: "Над текстом", left: "Слева от текста" },
    logoSize: "Размер логотипа",
    logoColour: "Цвет логотипа",
    logoRasterNote: "Картинку переведём в вектор и пришлём макет на согласование перед резкой. Логотип в нескольких цветах разложим по слоям.",
    logoSvgNote: "Перед резкой пришлём макет на согласование. Логотип в нескольких цветах разложим по слоям.",
    lineColour: "Цвет строки",
    lineColourOf: (n) => `Цвет строки ${n}`,
    arcLegend: "Текст по кругу",
    arcToggle: "Надпись вдоль края, как на эмблеме",
    arcTop: "Текст сверху",
    arcBottom: "Текст снизу",
    arcFont: "Шрифт текста по кругу",
    arcColour: "Цвет текста по кругу",
    frame: "Рамка",
    frameToggle: "Рамка вдоль края",
    frameColour: "Цвет рамки",
    mounting: "Крепление",
    adhesive: "Самоклейка на обороте",
    holes: { 0: "Без отверстий", 2: "2 отверстия с держателями", 4: "4 отверстия с держателями" },
    template: "Монтажный трафарет для ровного крепления (прорези на 0,2 мм больше деталей)",
    draftNoteLogo: "Логотип в ссылку не попадает: на другом устройстве добавьте файл ещё раз.",
    draftNote: "Откроет эту же вывеску на телефоне или другом компьютере.",
    cartTitle: (texts, logo, size) =>
      `Вывеска${texts ? ` «${texts}»` : ""}${logo === "own" ? " с логотипом" : logo === "development" ? ", разработка логотипа" : ""}, ${size}`,
  },
  en: {
    previewRegion: "Sign preview",
    previewLabel: (size) => `Sign preview ${size}`,
    onWallLabel: (label) => `${label}, on a wall next to a person 1.75 m tall`,
    lettersFrom: (cm) => ` · letters from ${cm} cm`,
    kicker: "Sign constructor",
    title: "3D acrylic business sign",
    lead: "A custom two-layer acrylic sign: a base and raised lettering, your logo, a mirror frame. No logo? We will design one for you. Round signs from Ø30 cm, from 1 600 ₴.",
    exampleLines: ["Dream", "BEAUTY SALON"],
    links: {
      pointer: "Arrow sign 25×10 cm from 450 ₴ →",
      office: "Office plaque 21×6 cm from 220 ₴ →",
      joined: "Words on a bar, acrylic menus →",
      floors: "Floor signs →",
      doors: "Door plaques →",
      numbers: "Door numbers from 65 ₴ →",
    },
    shapeSize: "Shape and size",
    shapes: { circle: "Circle", rect: "Rectangle", rounded: "Rounded", square: "Square", arrow: "Arrow", pointer: "Pointer" },
    left: "← Left",
    right: "Right →",
    baseColour: "Base color",
    surcharge: " · extra charge",
    logoHint: "SVG, PDF, PNG or JPG up to 10 MB, no extra charge",
    trySample: "Try a sample logo",
    sampleFailed: "Could not load the sample. Add your own logo.",
    logoDevStrong: "No logo? We will design one for you",
    logoDevRest: ", included in the sign price",
    logoBriefPlaceholder: "Name, line of business, style, colors, what you like",
    logoDevNote: "Our designer will draw 2–3 options and send them to you to choose from before production.",
    places: { above: "Above the text", left: "Left of the text" },
    logoSize: "Logo size",
    logoColour: "Logo color",
    logoRasterNote: "We will convert the image to vector and send you a layout to approve before cutting. A multi-color logo is split into layers.",
    logoSvgNote: "We will send you a layout to approve before cutting. A multi-color logo is split into layers.",
    lineColour: "Line color",
    lineColourOf: (n) => `Line ${n} color`,
    arcLegend: "Text around the circle",
    arcToggle: "Text along the edge, like on an emblem",
    arcTop: "Top text",
    arcBottom: "Bottom text",
    arcFont: "Font of the text around the circle",
    arcColour: "Color of the text around the circle",
    frame: "Frame",
    frameToggle: "Frame along the edge",
    frameColour: "Frame color",
    mounting: "Mounting",
    adhesive: "Self-adhesive back",
    holes: { 0: "No holes", 2: "2 holes with standoffs", 4: "4 holes with standoffs" },
    template: "Mounting template for straight installation (slots 0.2 mm larger than the pieces)",
    draftNoteLogo: "The logo is not saved in the link: add the file again on the other device.",
    draftNote: "Opens this same sign on your phone or another computer.",
    cartTitle: (texts, logo, size) =>
      `Sign${texts ? ` “${texts}”` : ""}${logo === "own" ? " with logo" : logo === "development" ? ", logo design" : ""}, ${size}`,
  },
};
