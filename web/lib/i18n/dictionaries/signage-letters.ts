// Texts of the letter constructors: «Написи на планці», wedding initials and self-adhesive letters
// (three products of one constructor). Words they share with the other sign constructors
// (font, colour, letter height, sets) are in signage.ts.

import type { Dictionary } from "../../../types/i18n";
import type { InitialsMode } from "../../../types/initials";
import type { StickLettersProduct } from "../../../types/stick-letters";

export interface JoinedWordsTexts {
  kicker: string;
  title: string;
  lead: string;
  /** Start text of the example lines (a coffee shop menu), in order. */
  firstLines: [string, string, string, string];
  previewRegion: string;
  previewLabel: (w: string, h: string) => string;
  linesLegend: string;
  tailLabel: string;
  tailPlaceholder: string;
  upperOnly: string;
  capHeightInput: string;
  heightNote: (min: string, max: string) => string;
  widestRow: string;
  fit: string;
  colourNote: (sheet: string, toOrder: string) => string;
  cartTitle: (words: string, letterCm: string, sheet: string) => string;
}

export interface InitialsTexts {
  kicker: string;
  title: string;
  lead: string;
  previewRegion: string;
  previewLabel: (w: string, h: string) => string;
  summary: (w: string, h: string, letterCm: string) => string;
  letters: string;
  first: string;
  second: string;
  fontNote: string;
  modeLegend: string;
  modes: Record<InitialsMode, { name: string; note: string }>;
  cartTitle: (initials: string, letterCm: string, sheet: string, topper: boolean) => string;
}

export interface StickLettersProductTexts {
  kicker: string;
  heading: string;
  intro: string;
  /** Start text of the lines, in the order of the start fonts. */
  startLines: string[];
  cartName: string;
}

export interface StickLettersTexts {
  products: Record<StickLettersProduct, StickLettersProductTexts>;
  previewRegion: string;
  previewLabel: (w: string, h: string) => string;
  viewBox: string;
  viewStencil: string;
  digitsLegend: string;
  removeDigit: (digit: string) => string;
  addDigit: (digit: string) => string;
  fullSet: string;
  clear: string;
  digitsNote: string;
  apart: string;
  joined: string;
  letters: string;
  caseAsTyped: string;
  caseUpper: string;
  caseNote: string;
  capHeightInput: string;
  mounting: string;
  withTape: string;
  noTape: string;
  piecePricesCaption: string;
  piecePricesNote: (minPrice: string) => string;
  cartTitle: (name: string, text: string, w: string, h: string, sheet: string, adhesive: boolean, upper: boolean) => string;
}

export interface SignageLettersTexts {
  joinedWords: JoinedWordsTexts;
  initials: InitialsTexts;
  stickLetters: StickLettersTexts;
}

export const SIGNAGE_LETTERS: Dictionary<SignageLettersTexts> = {
  uk: {
    joinedWords: {
      kicker: "Конструктор написів",
      title: "Написи на планці з акрилу",
      lead: "Кожне слово вирізаємо однією деталлю: літери стоять на тонкій планці. Меню для кавʼярні, назви зон, цитати на стіну. Ціна поруч з кожним рядком стане окремою деталлю.",
      firstLines: ["ЛАТЕ ГАРБУЗОВИЙ", "СОЛОНА КАРАМЕЛЬ", "СІНАБОН", "ПОПКОРН"],
      previewRegion: "Превʼю напису",
      previewLabel: (w, h) => `Превʼю напису ${w}×${h} см`,
      linesLegend: "Рядки",
      tailLabel: "Ціна чи число окремою деталлю (необовʼязково)",
      tailPlaceholder: "Напр. 110 або 110/160",
      upperOnly: "Лише великі літери",
      capHeightInput: "Своя висота великих літер, см",
      heightNote: (min, max) => `Від ${min} до ${max} см. Розмір кожного рядка міняйте у полі «Розмір літер».`,
      widestRow: "Або довжина найширшого рядка, см",
      fit: "Підібрати",
      colourNote: (sheet, toOrder) => `${sheet}, один шар${toOrder}. Усі кольори за однією ціною.`,
      cartTitle: (words, letterCm, sheet) => `Напис на планці «${words}», літери ${letterCm} см, ${sheet}`,
    },
    initials: {
      kicker: "Весільний декор",
      title: "Ініціали на весільний торт",
      lead: "Перші літери імен з дзеркального акрилу: золото, срібло чи будь-який колір. Свій розмір і шрифт, ціна одразу.",
      previewRegion: "Превʼю ініціалів",
      previewLabel: (w, h) => `Превʼю ініціалів ${w}×${h} см`,
      summary: (w, h, letterCm) => `${w} × ${h} см · літери ${letterCm} см`,
      letters: "Літери",
      first: "Перша",
      second: "Друга",
      fontNote: "PT Serif схожий на класичний Times, як на прикладі. Можна взяти будь-який інший або свій.",
      modeLegend: "Як ставити на торт",
      modes: {
        pieces: { name: "Окремими деталями", note: "Літери і риска лягають на торт, як на фото" },
        topper: { name: "Топпером зі шпажкою", note: "Усе на тонкій планці, стоїть у торті" },
      },
      cartTitle: (initials, letterCm, sheet, topper) => `Ініціали на торт «${initials}», літери ${letterCm} см, ${sheet}${topper ? ", топпер" : ""}`,
    },
    stickLetters: {
      products: {
        letters: {
          kicker: "Весільний декор і подарунки",
          heading: "Самоклейні літери з акрилу",
          intro: "Напис для коробки з листівками, подарунка чи столу: обʼємні літери 3 мм зі скотчем на звороті. Картонний трафарет для рівної поклейки вже в ціні.",
          startLines: ["ПОДАРУНКИ", "та", "ЛИСТІВКИ"],
          cartName: "Самоклейні літери",
        },
        chars: {
          kicker: "Декор і навігація",
          heading: "Акрилові цифри і літери",
          intro: "Окремі цифри і літери з акрилу 3 мм заввишки від 2 до 80 см: номер будинку чи квартири, дата, ініціали, декор. Будь-який колір і шрифт, зі скотчем на звороті або без.",
          startLines: ["2026"],
          cartName: "Акрилові цифри і літери",
        },
        "sign-letters": {
          kicker: "Реклама, написи, вивіски",
          heading: "Самоклейні літери для вивісок і написів",
          intro: "Окремі великі й малі літери з акрилу 3 мм зі скотчем на звороті, заввишки від 2 до 20 см: напис на вітрині, стіні, дверях чи стенді. Чорні, білі або дзеркальні. Ціна кожної літери за її розміром.",
          startLines: ["Кавʼярня"],
          cartName: "Самоклейні літери для вивіски",
        },
      },
      previewRegion: "Превʼю літер",
      previewLabel: (w, h) => `Превʼю самоклейних літер ${w}×${h} см`,
      viewBox: "На коробці",
      viewStencil: "Трафарет для поклейки",
      digitsLegend: "Які цифри потрібні",
      removeDigit: (digit) => `Прибрати цифру ${digit}`,
      addDigit: (digit) => `Додати цифру ${digit}`,
      fullSet: "+ Повний набір 0–9",
      clear: "Очистити",
      digitsNote: "Натисніть «+» біля потрібних цифр або впишіть номер нижче, наприклад 125. Кожна цифра вирізається окремою деталлю.",
      apart: "Окремі літери",
      joined: "Злите слово",
      letters: "Літери",
      caseAsTyped: "Великі й малі, як написано",
      caseUpper: "УСІ ВЕЛИКІ",
      caseNote: "Висота нижче — це висота великої літери. Малі літери нижчі, тому й дешевші.",
      capHeightInput: "Своя висота великої літери, см",
      mounting: "Кріплення",
      withTape: "Зі скотчем на звороті",
      noTape: "Без скотчу",
      piecePricesCaption: "Ціна кожної деталі",
      piecePricesNote: (minPrice) => `Ціна кожної деталі за її розміром. Сума округлюється до 10 ₴, найменше замовлення ${minPrice}.`,
      cartTitle: (name, text, w, h, sheet, adhesive, upper) =>
        `${name} «${text}», ${w}×${h} см, ${sheet}${adhesive ? "" : ", без самоклейки"}${upper ? ", усі великі" : ""}`,
    },
  },
  ru: {
    joinedWords: {
      kicker: "Конструктор надписей",
      title: "Надписи на планке из акрила",
      lead: "Каждое слово вырезаем одной деталью: буквы стоят на тонкой планке. Меню для кофейни, названия зон, цитаты на стену. Цена рядом с каждой строкой станет отдельной деталью.",
      firstLines: ["ЛАТТЕ ТЫКВЕННЫЙ", "СОЛЁНАЯ КАРАМЕЛЬ", "СИННАБОН", "ПОПКОРН"],
      previewRegion: "Превью надписи",
      previewLabel: (w, h) => `Превью надписи ${w}×${h} см`,
      linesLegend: "Строки",
      tailLabel: "Цена или число отдельной деталью (необязательно)",
      tailPlaceholder: "Напр. 110 или 110/160",
      upperOnly: "Только заглавные буквы",
      capHeightInput: "Своя высота заглавных букв, см",
      heightNote: (min, max) => `От ${min} до ${max} см. Размер каждой строки меняйте в поле «Размер букв».`,
      widestRow: "Или длина самой широкой строки, см",
      fit: "Подобрать",
      colourNote: (sheet, toOrder) => `${sheet}, один слой${toOrder}. Все цвета по одной цене.`,
      cartTitle: (words, letterCm, sheet) => `Надпись на планке «${words}», буквы ${letterCm} см, ${sheet}`,
    },
    initials: {
      kicker: "Свадебный декор",
      title: "Инициалы на свадебный торт",
      lead: "Первые буквы имён из зеркального акрила: золото, серебро или любой цвет. Свой размер и шрифт, цена сразу.",
      previewRegion: "Превью инициалов",
      previewLabel: (w, h) => `Превью инициалов ${w}×${h} см`,
      summary: (w, h, letterCm) => `${w} × ${h} см · буквы ${letterCm} см`,
      letters: "Буквы",
      first: "Первая",
      second: "Вторая",
      fontNote: "PT Serif похож на классический Times, как на примере. Можно взять любой другой или свой.",
      modeLegend: "Как ставить на торт",
      modes: {
        pieces: { name: "Отдельными деталями", note: "Буквы и черта ложатся на торт, как на фото" },
        topper: { name: "Топпером со шпажкой", note: "Всё на тонкой планке, стоит в торте" },
      },
      cartTitle: (initials, letterCm, sheet, topper) => `Инициалы на торт «${initials}», буквы ${letterCm} см, ${sheet}${topper ? ", топпер" : ""}`,
    },
    stickLetters: {
      products: {
        letters: {
          kicker: "Свадебный декор и подарки",
          heading: "Самоклеящиеся буквы из акрила",
          intro: "Надпись для коробки с открытками, подарка или стола: объёмные буквы 3 мм со скотчем на обороте. Картонный трафарет для ровной поклейки уже в цене.",
          startLines: ["ПОДАРКИ", "и", "ОТКРЫТКИ"],
          cartName: "Самоклеящиеся буквы",
        },
        chars: {
          kicker: "Декор и навигация",
          heading: "Акриловые цифры и буквы",
          intro: "Отдельные цифры и буквы из акрила 3 мм высотой от 2 до 80 см: номер дома или квартиры, дата, инициалы, декор. Любой цвет и шрифт, со скотчем на обороте или без.",
          startLines: ["2026"],
          cartName: "Акриловые цифры и буквы",
        },
        "sign-letters": {
          kicker: "Реклама, надписи, вывески",
          heading: "Самоклеящиеся буквы для вывесок и надписей",
          intro: "Отдельные заглавные и строчные буквы из акрила 3 мм со скотчем на обороте, высотой от 2 до 20 см: надпись на витрине, стене, двери или стенде. Чёрные, белые или зеркальные. Цена каждой буквы по её размеру.",
          startLines: ["Кофейня"],
          cartName: "Самоклеящиеся буквы для вывески",
        },
      },
      previewRegion: "Превью букв",
      previewLabel: (w, h) => `Превью самоклеящихся букв ${w}×${h} см`,
      viewBox: "На коробке",
      viewStencil: "Трафарет для поклейки",
      digitsLegend: "Какие цифры нужны",
      removeDigit: (digit) => `Убрать цифру ${digit}`,
      addDigit: (digit) => `Добавить цифру ${digit}`,
      fullSet: "+ Полный набор 0–9",
      clear: "Очистить",
      digitsNote: "Нажмите «+» возле нужных цифр или впишите номер ниже, например 125. Каждая цифра вырезается отдельной деталью.",
      apart: "Отдельные буквы",
      joined: "Слитное слово",
      letters: "Буквы",
      caseAsTyped: "Заглавные и строчные, как написано",
      caseUpper: "ВСЕ ЗАГЛАВНЫЕ",
      caseNote: "Высота ниже — это высота заглавной буквы. Строчные буквы ниже, поэтому и дешевле.",
      capHeightInput: "Своя высота заглавной буквы, см",
      mounting: "Крепление",
      withTape: "Со скотчем на обороте",
      noTape: "Без скотча",
      piecePricesCaption: "Цена каждой детали",
      piecePricesNote: (minPrice) => `Цена каждой детали по её размеру. Сумма округляется до 10 ₴, минимальный заказ ${minPrice}.`,
      cartTitle: (name, text, w, h, sheet, adhesive, upper) =>
        `${name} «${text}», ${w}×${h} см, ${sheet}${adhesive ? "" : ", без скотча"}${upper ? ", все заглавные" : ""}`,
    },
  },
  en: {
    joinedWords: {
      kicker: "Lettering constructor",
      title: "Acrylic words on a bar",
      lead: "We cut each word as one piece: the letters stand on a thin bar. A coffee shop menu, zone names, quotes for the wall. The price next to each line becomes a separate piece.",
      firstLines: ["PUMPKIN LATTE", "SALTED CARAMEL", "CINNABON", "POPCORN"],
      previewRegion: "Lettering preview",
      previewLabel: (w, h) => `Lettering preview ${w}×${h} cm`,
      linesLegend: "Lines",
      tailLabel: "Price or number as a separate piece (optional)",
      tailPlaceholder: "E.g. 110 or 110/160",
      upperOnly: "Capital letters only",
      capHeightInput: "Custom capital letter height, cm",
      heightNote: (min, max) => `From ${min} to ${max} cm. Change the size of each line in the “Letter size” field.`,
      widestRow: "Or the length of the widest line, cm",
      fit: "Fit",
      colourNote: (sheet, toOrder) => `${sheet}, one layer${toOrder}. All colors at one price.`,
      cartTitle: (words, letterCm, sheet) => `Words on a bar “${words}”, letters ${letterCm} cm, ${sheet}`,
    },
    initials: {
      kicker: "Wedding decor",
      title: "Wedding cake initials",
      lead: "The first letters of your names in mirror acrylic: gold, silver or any color. Your own size and font, price right away.",
      previewRegion: "Initials preview",
      previewLabel: (w, h) => `Initials preview ${w}×${h} cm`,
      summary: (w, h, letterCm) => `${w} × ${h} cm · letters ${letterCm} cm`,
      letters: "Letters",
      first: "First",
      second: "Second",
      fontNote: "PT Serif looks like the classic Times, as in the example. You can pick any other font or upload your own.",
      modeLegend: "How to place on the cake",
      modes: {
        pieces: { name: "Separate pieces", note: "The letters and the dash lie on the cake, as in the photo" },
        topper: { name: "Cake topper on a stick", note: "Everything on a thin bar that stands in the cake" },
      },
      cartTitle: (initials, letterCm, sheet, topper) => `Cake initials “${initials}”, letters ${letterCm} cm, ${sheet}${topper ? ", topper" : ""}`,
    },
    stickLetters: {
      products: {
        letters: {
          kicker: "Wedding decor and gifts",
          heading: "Self-adhesive acrylic letters",
          intro: "Lettering for a card box, a gift or a table: raised 3 mm letters with tape on the back. A cardboard mounting template for even placement is included in the price.",
          startLines: ["GIFTS", "and", "CARDS"],
          cartName: "Self-adhesive letters",
        },
        chars: {
          kicker: "Decor and wayfinding",
          heading: "Acrylic letters and numbers",
          intro: "Separate 3 mm acrylic numbers and letters from 2 to 80 cm tall: a house or apartment number, a date, initials, decor. Any color and font, with tape on the back or without.",
          startLines: ["2026"],
          cartName: "Acrylic letters and numbers",
        },
        "sign-letters": {
          kicker: "Advertising, lettering, signs",
          heading: "Self-adhesive letters for signs and lettering",
          intro: "Separate capital and lowercase 3 mm acrylic letters with tape on the back, from 2 to 20 cm tall: lettering for a shop window, wall, door or stand. Black, white or mirror. Each letter is priced by its size.",
          startLines: ["Coffee shop"],
          cartName: "Self-adhesive sign letters",
        },
      },
      previewRegion: "Letters preview",
      previewLabel: (w, h) => `Self-adhesive letters preview ${w}×${h} cm`,
      viewBox: "On a box",
      viewStencil: "Mounting template",
      digitsLegend: "Which numbers you need",
      removeDigit: (digit) => `Remove number ${digit}`,
      addDigit: (digit) => `Add number ${digit}`,
      fullSet: "+ Full set 0–9",
      clear: "Clear",
      digitsNote: "Tap “+” next to the numbers you need or type a number below, for example 125. Each digit is cut as a separate piece.",
      apart: "Separate letters",
      joined: "Joined word",
      letters: "Letters",
      caseAsTyped: "Capital and lowercase, as typed",
      caseUpper: "ALL CAPITALS",
      caseNote: "The height below is the height of a capital letter. Lowercase letters are shorter, so they cost less.",
      capHeightInput: "Custom capital letter height, cm",
      mounting: "Mounting",
      withTape: "With tape on the back",
      noTape: "No tape",
      piecePricesCaption: "Price of each piece",
      piecePricesNote: (minPrice) => `Each piece is priced by its size. The total is rounded to 10 ₴, minimum order ${minPrice}.`,
      cartTitle: (name, text, w, h, sheet, adhesive, upper) =>
        `${name} “${text}”, ${w}×${h} cm, ${sheet}${adhesive ? "" : ", no tape"}${upper ? ", all capitals" : ""}`,
    },
  },
};
