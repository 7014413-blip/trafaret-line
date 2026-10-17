// Texts of the pointer sign, office plaque and two-layer plaque constructors. Shared words
// (lines, sizes, logo, base, quantities) come from signage.ts; material and colour names come
// with the data in every language.

import type { Dictionary } from "../../../types/i18n";
import type { LayeredPlaqueKind } from "../../../types/layered-plaque";
import type { PointerArrowPlacement } from "../../../types/pointer-sign";

export interface LayeredKindTexts {
  kicker: string;
  h1: string;
  lead: string;
  base: string;
  overlay: string;
  frame: string;
  series: string;
  cartName: string;
  /** Example text of each line the constructor starts with. */
  startLines: string[];
}

export interface SignagePlaquesTexts {
  previewRegion: string;
  // Pointer sign.
  pointer: {
    startLines: [string, string];
    arrows: Record<PointerArrowPlacement, string>;
    previewLabel: (size: string) => string;
    tip: (left: boolean) => string;
    kicker: string;
    title: string;
    lead: string;
    sizeNoteStart: (minW: string, maxW: string, maxHeightShare: number) => string;
    signConstructor: string;
    shape: string;
    shapePointer: string;
    shapeArrow: string;
    shapeArrowNote: string;
    shapePointerNote: string;
    samePrice: string;
    direction: string;
    left: string;
    right: string;
    directionNote: string;
    smallArrow: string;
    inLine: (n: number) => string;
    logoHint: string;
    logoRing: string;
    logoNote: string;
    overlay: string;
    cartTitle: (texts: string, size: string) => string;
  };
  // Office plaque.
  office: {
    startLines: [string, string];
    previewLabel: (size: string) => string;
    tape: string;
    layers: (base: string, plate: string) => string;
    kicker: string;
    title: string;
    lead: string;
    linesLegend: string;
    plate: string;
    plateColour: string;
    plateNote: (plate: string) => string;
    cartTitle: (texts: string, size: string, plate: string) => string;
  };
  // Two-layer plaques.
  layered: {
    kinds: Record<LayeredPlaqueKind, LayeredKindTexts>;
    previewLabel: (name: string, size: string) => string;
    numbers: (from: number, to: number) => string;
    seriesToggle: string;
    from: string;
    to: string;
    seriesNote: (line: number) => string;
    withFrame: string;
    noFrame: string;
    setOf: (count: number) => string;
  };
}

export const SIGNAGE_PLAQUES: Dictionary<SignagePlaquesTexts> = {
  uk: {
    previewRegion: "Превʼю таблички",
    pointer: {
      startLines: ["КАВʼЯРНЯ", "ВХІД З ДВОРУ"],
      arrows: { start: "Перед текстом", end: "Після тексту", none: "Без стрілки" },
      previewLabel: (size) => `Превʼю таблички-вказівника ${size} см`,
      tip: (left) => `вістря ${left ? "вліво" : "вправо"}`,
      kicker: "Конструктор вказівників",
      title: "Табличка-стрілка обʼємна, у два шари",
      lead: "Напишіть свій текст, оберіть шрифт, кольори й напрямок. Усі матеріали й кольори вже в ціні.",
      sizeNoteStart: (minW, maxW, share) => `Від ${minW} до ${maxW} см завширшки, висота не більше ${share}% ширини. Більша вивіска: `,
      signConstructor: "конструктор вивісок",
      shape: "Форма",
      shapePointer: "Табличка з вістрям",
      shapeArrow: "Стрілка",
      shapeArrowNote: "Класична стрілка: напис на корпусі, логотип у голові стрілки.",
      shapePointerNote: "Прямокутна табличка з гострим краєм, як на наших фото.",
      samePrice: " Ціна однакова.",
      direction: "Куди показує стрілка",
      left: "← Вліво",
      right: "Вправо →",
      directionNote: "Вістря таблички і маленька стрілка в тексті показують в один бік.",
      smallArrow: "Маленька стрілка в тексті",
      inLine: (n) => `У рядку ${n}`,
      logoHint: "SVG, PNG або JPG до 10 МБ, без доплати",
      logoRing: "Коло навколо логотипа",
      logoNote: "Логотип виріжемо з того ж матеріалу, що й напис. Перед порізкою надішлемо макет на погодження.",
      overlay: "Колір напису і логотипа",
      cartTitle: (texts, size) => `Табличка-вказівник${texts ? ` «${texts}»` : ""}, ${size} см`,
    },
    office: {
      startLines: ["Олена Коваленко", "ДИРЕКТОРКА"],
      previewLabel: (size) => `Превʼю офісної таблички ${size} см`,
      tape: " · на клейовій основі 3M",
      layers: (base, plate) => `Основа ${base} + ${plate} з гравіюванням`,
      kicker: "Конструктор табличок",
      title: "Офісна табличка з гравіюванням",
      lead: "Акрилова основа і дзеркальна пластина з вашим написом. Клеїться на двері чи стіну, клейова основа 3M уже в ціні.",
      linesLegend: "Текст для гравіювання",
      plate: "Пластина з гравіюванням",
      plateColour: "Колір пластини",
      plateNote: (plate) => `${plate}, дзеркальна, напис гравіюється до темного шару`,
      cartTitle: (texts, size, plate) => `Офісна табличка «${texts}», ${size} см, ${plate}`,
    },
    layered: {
      kinds: {
        floor: {
          kicker: "Таблички для будинку", h1: "Табличка поверху «ПОВЕРХ 1»",
          lead: "Обʼємна табличка з двох шарів акрилу: основа біла чи чорна, напис, номер і рамка з дзеркального акрилу. Замовте одразу весь будинок: кожен поверх своя табличка.",
          base: "Основа", overlay: "Напис і рамка", frame: "Дзеркальна рамка", series: "Усі поверхи одразу", cartName: "Табличка поверху",
          startLines: ["ПОВЕРХ", "1"],
        },
        door: {
          kicker: "Таблички на двері", h1: "Табличка на двері з дзеркальною окантовкою",
          lead: "Довга табличка із заокругленими кутами: акрилова основа, дзеркальна окантовка по краю і обʼємні літери. Для кабінетів, салонів, офісів.",
          base: "Основа", overlay: "Літери й окантовка", frame: "Дзеркальна окантовка", series: "", cartName: "Табличка на двері",
          startLines: ["Косметологія"],
        },
        number: {
          kicker: "Номерки", h1: "Номерок на двері з двох шарів акрилу",
          lead: "Лицьовий шар з вирізаним номером лежить на нижньому шарі іншого кольору зі зсувом. Клейова основа вже в ціні. Номери кабінетів, квартир, столиків.",
          base: "Лицьовий шар", overlay: "Нижній шар і колір номера", frame: "", series: "Набір номерів", cartName: "Номерок",
          startLines: ["100"],
        },
      },
      previewLabel: (name, size) => `Превʼю: ${name} ${size} см`,
      numbers: (from, to) => ` · номери ${from}–${to}`,
      seriesToggle: "Зробити таблички з номерами по порядку (кожен номер окрема табличка)",
      from: "Від",
      to: "До",
      seriesNote: (line) => `Номер у рядку ${line} заміниться на кожне число. Знижка рахується за всі таблички разом.`,
      withFrame: "З рамкою",
      noFrame: "Без рамки",
      setOf: (count) => `, набір ${count} шт.`,
    },
  },
  ru: {
    previewRegion: "Превью таблички",
    pointer: {
      startLines: ["КОФЕЙНЯ", "ВХОД СО ДВОРА"],
      arrows: { start: "Перед текстом", end: "После текста", none: "Без стрелки" },
      previewLabel: (size) => `Превью таблички-указателя ${size} см`,
      tip: (left) => `остриё ${left ? "влево" : "вправо"}`,
      kicker: "Конструктор указателей",
      title: "Табличка-стрелка объёмная, в два слоя",
      lead: "Напишите свой текст, выберите шрифт, цвета и направление. Все материалы и цвета уже в цене.",
      sizeNoteStart: (minW, maxW, share) => `От ${minW} до ${maxW} см в ширину, высота не больше ${share}% ширины. Вывеска побольше: `,
      signConstructor: "конструктор вывесок",
      shape: "Форма",
      shapePointer: "Табличка с остриём",
      shapeArrow: "Стрелка",
      shapeArrowNote: "Классическая стрелка: надпись на корпусе, логотип в голове стрелки.",
      shapePointerNote: "Прямоугольная табличка с острым краем, как на наших фото.",
      samePrice: " Цена одинаковая.",
      direction: "Куда показывает стрелка",
      left: "← Влево",
      right: "Вправо →",
      directionNote: "Остриё таблички и маленькая стрелка в тексте показывают в одну сторону.",
      smallArrow: "Маленькая стрелка в тексте",
      inLine: (n) => `В строке ${n}`,
      logoHint: "SVG, PNG или JPG до 10 МБ, без доплаты",
      logoRing: "Круг вокруг логотипа",
      logoNote: "Логотип вырежем из того же материала, что и надпись. Перед резкой пришлём макет на согласование.",
      overlay: "Цвет надписи и логотипа",
      cartTitle: (texts, size) => `Табличка-указатель${texts ? ` «${texts}»` : ""}, ${size} см`,
    },
    office: {
      startLines: ["Елена Коваленко", "ДИРЕКТОР"],
      previewLabel: (size) => `Превью офисной таблички ${size} см`,
      tape: " · на клеевой основе 3M",
      layers: (base, plate) => `Основа ${base} + ${plate} с гравировкой`,
      kicker: "Конструктор табличек",
      title: "Офисная табличка с гравировкой",
      lead: "Акриловая основа и зеркальная пластина с вашей надписью. Клеится на дверь или стену, клеевая основа 3M уже в цене.",
      linesLegend: "Текст для гравировки",
      plate: "Пластина с гравировкой",
      plateColour: "Цвет пластины",
      plateNote: (plate) => `${plate}, зеркальная, надпись гравируется до тёмного слоя`,
      cartTitle: (texts, size, plate) => `Офисная табличка «${texts}», ${size} см, ${plate}`,
    },
    layered: {
      kinds: {
        floor: {
          kicker: "Таблички для дома", h1: "Табличка этажа «ЭТАЖ 1»",
          lead: "Объёмная табличка из двух слоёв акрила: основа белая или чёрная, надпись, номер и рамка из зеркального акрила. Закажите сразу весь дом: на каждый этаж своя табличка.",
          base: "Основа", overlay: "Надпись и рамка", frame: "Зеркальная рамка", series: "Все этажи сразу", cartName: "Табличка этажа",
          startLines: ["ЭТАЖ", "1"],
        },
        door: {
          kicker: "Таблички на дверь", h1: "Табличка на дверь с зеркальной окантовкой",
          lead: "Длинная табличка со скруглёнными углами: акриловая основа, зеркальная окантовка по краю и объёмные буквы. Для кабинетов, салонов, офисов.",
          base: "Основа", overlay: "Буквы и окантовка", frame: "Зеркальная окантовка", series: "", cartName: "Табличка на дверь",
          startLines: ["Косметология"],
        },
        number: {
          kicker: "Номерки", h1: "Номерок на дверь из двух слоёв акрила",
          lead: "Лицевой слой с вырезанным номером лежит на нижнем слое другого цвета со смещением. Клеевая основа уже в цене. Номера кабинетов, квартир, столиков.",
          base: "Лицевой слой", overlay: "Нижний слой и цвет номера", frame: "", series: "Набор номеров", cartName: "Номерок",
          startLines: ["100"],
        },
      },
      previewLabel: (name, size) => `Превью: ${name} ${size} см`,
      numbers: (from, to) => ` · номера ${from}–${to}`,
      seriesToggle: "Сделать таблички с номерами по порядку (каждый номер — отдельная табличка)",
      from: "От",
      to: "До",
      seriesNote: (line) => `Номер в строке ${line} заменится на каждое число. Скидка считается за все таблички вместе.`,
      withFrame: "С рамкой",
      noFrame: "Без рамки",
      setOf: (count) => `, набор ${count} шт.`,
    },
  },
  en: {
    previewRegion: "Plaque preview",
    pointer: {
      startLines: ["COFFEE SHOP", "YARD ENTRANCE"],
      arrows: { start: "Before the text", end: "After the text", none: "No arrow" },
      previewLabel: (size) => `Pointer sign preview ${size} cm`,
      tip: (left) => `tip pointing ${left ? "left" : "right"}`,
      kicker: "Pointer sign constructor",
      title: "Raised two-layer arrow sign",
      lead: "Type your text, choose the font, colors and direction. All materials and colors are included in the price.",
      sizeNoteStart: (minW, maxW, share) => `From ${minW} to ${maxW} cm wide, height no more than ${share}% of the width. For a bigger sign, use the `,
      signConstructor: "sign constructor",
      shape: "Shape",
      shapePointer: "Plaque with a pointed end",
      shapeArrow: "Arrow",
      shapeArrowNote: "Classic arrow: the text on the body, the logo in the arrowhead.",
      shapePointerNote: "Rectangular plaque with a pointed edge, as in our photos.",
      samePrice: " Same price.",
      direction: "Where the arrow points",
      left: "← Left",
      right: "Right →",
      directionNote: "The tip of the plaque and the small arrow in the text point the same way.",
      smallArrow: "Small arrow in the text",
      inLine: (n) => `In line ${n}`,
      logoHint: "SVG, PNG or JPG up to 10 MB, no extra charge",
      logoRing: "Circle around the logo",
      logoNote: "We cut the logo from the same material as the text. We send you a layout to approve before cutting.",
      overlay: "Text and logo color",
      cartTitle: (texts, size) => `Pointer sign${texts ? ` “${texts}”` : ""}, ${size} cm`,
    },
    office: {
      startLines: ["Olena Kovalenko", "DIRECTOR"],
      previewLabel: (size) => `Office plaque preview ${size} cm`,
      tape: " · on 3M adhesive",
      layers: (base, plate) => `${base} base + ${plate} with engraving`,
      kicker: "Plaque constructor",
      title: "Engraved office plaque",
      lead: "An acrylic base and a mirror plate with your text. Sticks to a door or wall, 3M adhesive included in the price.",
      linesLegend: "Text for engraving",
      plate: "Engraved plate",
      plateColour: "Plate color",
      plateNote: (plate) => `${plate}, mirror, the text is engraved down to the dark layer`,
      cartTitle: (texts, size, plate) => `Office plaque “${texts}”, ${size} cm, ${plate}`,
    },
    layered: {
      kinds: {
        floor: {
          kicker: "Plaques for buildings", h1: "Floor sign “FLOOR 1”",
          lead: "A raised plaque of two acrylic layers: a white or black base, with the text, number and frame in mirror acrylic. Order the whole building at once: a plaque for every floor.",
          base: "Base", overlay: "Text and frame", frame: "Mirror frame", series: "All floors at once", cartName: "Floor sign",
          startLines: ["FLOOR", "1"],
        },
        door: {
          kicker: "Door plaques", h1: "Door plaque with a mirror border",
          lead: "A long plaque with rounded corners: an acrylic base, a mirror border along the edge and raised letters. For offices, salons and consulting rooms.",
          base: "Base", overlay: "Letters and border", frame: "Mirror border", series: "", cartName: "Door plaque",
          startLines: ["Cosmetology"],
        },
        number: {
          kicker: "Door numbers", h1: "Two-layer acrylic door number",
          lead: "The top layer with the cut-out number sits slightly offset on a bottom layer of another color. Adhesive backing included in the price. Numbers for offices, apartments, tables.",
          base: "Top layer", overlay: "Bottom layer and number color", frame: "", series: "Set of numbers", cartName: "Door number",
          startLines: ["100"],
        },
      },
      previewLabel: (name, size) => `Preview: ${name} ${size} cm`,
      numbers: (from, to) => ` · numbers ${from}–${to}`,
      seriesToggle: "Make plaques with consecutive numbers (each number is a separate plaque)",
      from: "From",
      to: "To",
      seriesNote: (line) => `The number in line ${line} is replaced with each number in turn. The discount counts all plaques together.`,
      withFrame: "With frame",
      noFrame: "No frame",
      setOf: (count) => `, set of ${count} pcs`,
    },
  },
};
