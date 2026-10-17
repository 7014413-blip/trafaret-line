// Search titles and descriptions of the constructor pages, by the page path (without the
// language prefix). The page bodies are client components that read their own texts.

import type { Dictionary } from "../../../types/i18n";

export interface PageMetaText {
  title: string;
  description: string;
}

export type ConstructorPagePath =
  | "/konstruktor" | "/konstruktor/polotno" | "/zahotovky"
  | "/konstruktor/akrylovi-tsyfry-i-litery"
  | "/konstruktor/inicialy-na-tort"
  | "/konstruktor/samoklejni-litery-dlia-vyvisok"
  | "/konstruktor/samoklejni-litery"
  | "/vyvisky"
  | "/vyvisky/napysy-na-plantsi"
  | "/vyvisky/nomerky"
  | "/vyvisky/ofisni-tablychky"
  | "/vyvisky/tablychky-na-dveri"
  | "/vyvisky/tablychky-poverkh"
  | "/vyvisky/vkazivnyky";

export const CONSTRUCTOR_PAGES: Dictionary<Record<ConstructorPagePath, PageMetaText>> = {
  uk: {
    "/konstruktor": {
      title: "Свій напис на трафареті — конструктор з превʼю і ціною",
      description: "Впишіть текст, оберіть шрифт, розмір і матеріал. Перемички в літерах ставимо автоматично, ціна одразу. Виготовлення 3 робочі дні.",
    },
    "/konstruktor/polotno": {
      title: "Вільне полотно: кілька написів і фігур на одному трафареті",
      description: "Розставте написи, коло, зірку, серце або рамку на одному аркуші. Перемички ставимо автоматично, тонкі місця підсвічуємо, ціна одразу.",
    },
    "/zahotovky": {
      title: "Заготовки з акрилу, дзеркального пластику і PET у ваш розмір",
      description: "Кола, квадрати, серця, зірки, арки та інші форми з прозорого, кольорового і дзеркального акрилу, підкладки під торт з PET і полістиролу. Свій розмір, ціна за штуку одразу, опт від 10 шт.",
    },
    "/konstruktor/akrylovi-tsyfry-i-litery": {
      title: "Акрилові цифри і літери від 2 до 80 см — конструктор з ціною",
      description: "Окремі цифри і літери з акрилу 3 мм: номер будинку, квартири, дата, ініціали, декор. Висота від 2 до 80 см, будь-який колір і шрифт, зі скотчем або без. Ціна одразу.",
    },
    "/konstruktor/inicialy-na-tort": {
      title: "Ініціали на весільний торт з акрилу — конструктор з ціною",
      description: "Ініціали молодят на торт: дві літери з роздільником, свій шрифт, розмір і колір, дзеркальний або кольоровий акрил. Окремими деталями або на планці зі шпажкою, ціна одразу.",
    },
    "/konstruktor/samoklejni-litery-dlia-vyvisok": {
      title: "Самоклейні літери з акрилу для вивісок і написів — конструктор з ціною",
      description: "Окремі великі й малі літери з акрилу 3 мм зі скотчем на звороті, від 2 до 20 см: написи на вітрину, стіну, двері, рекламу. Чорні, білі, дзеркальні золото, срібло, рожеве золото. Ціна кожної літери одразу.",
    },
    "/konstruktor/samoklejni-litery": {
      title: "Самоклейні літери з акрилу для коробки з листівками — конструктор з ціною",
      description: "Обʼємні літери з акрилу 3 мм зі скотчем на звороті: напис на весільну коробку для листівок, подарунок чи стіл. Свій текст і шрифт для кожного рядка, злиті або окремі літери, картонний трафарет у ціні.",
    },
    "/vyvisky": {
      title: "Вивіска з логотипом з акрилу — конструктор з ціною одразу",
      description: "Двошарові вивіски з акрилу для салону, кавʼярні, офісу: ваш логотип, напис, дзеркальна рамка, кругла чи прямокутна форма, самоклейка або тримачі. Ціна одразу, виготовлення 3 робочі дні.",
    },
    "/vyvisky/napysy-na-plantsi": {
      title: "Написи на планці з акрилу — меню для кавʼярні, конструктор з ціною",
      description: "Слова з акрилу, де літери стоять на тонкій планці: кожне слово однією деталлю. Меню з цінами, назви зон, написи на стіну. Свій шрифт, колір і висота літер, ціна одразу.",
    },
    "/vyvisky/nomerky": {
      title: "Номерки на двері з двох шарів акрилу — конструктор, від 65 ₴",
      description: "Номерок для кабінету, квартири чи столика: два шари акрилу зі зсувом, номер вирізаний у лицьовому шарі, клейова основа. 8×8 см 65 ₴, набір номерів одразу.",
    },
    "/vyvisky/ofisni-tablychky": {
      title: "Офісна табличка з гравіюванням — конструктор, ціна одразу",
      description: "Табличка на двері чи стіну: чорна або біла основа, дзеркальна пластина золото, срібло, бронзове золото чи сатин срібло з вашим написом. 21×6 см від 220 ₴, клейова основа 3M.",
    },
    "/vyvisky/tablychky-na-dveri": {
      title: "Таблички на двері з дзеркальною окантовкою — конструктор",
      description: "Табличка на двері кабінету чи салону: акрилова основа, золота чи срібна дзеркальна окантовка і обʼємні літери. Свій текст, шрифт і колір, ціна одразу.",
    },
    "/vyvisky/tablychky-poverkh": {
      title: "Таблички поверхів «ПОВЕРХ 1» для будинку — конструктор, ціна одразу",
      description: "Обʼємні таблички поверху з акрилу: біла чи чорна основа, напис, номер і рамка із золотого чи срібного дзеркального акрилу. 13×18 см 360 ₴, набір на всі поверхи одразу.",
    },
    "/vyvisky/vkazivnyky": {
      title: "Табличка-вказівник зі стрілкою — конструктор, ціна одразу",
      description: "Обʼємна двошарова табличка-стрілка з вашим написом і логотипом: 25×10 см від 450 ₴, свій шрифт, колір основи й напису, напрямок вліво чи вправо. Виготовлення 3 робочі дні.",
    },
  },
  ru: {
    "/konstruktor": {
      title: "Своя надпись на трафарете — конструктор с превью и ценой",
      description: "Впишите текст, выберите шрифт, размер и материал. Перемычки в буквах ставим автоматически, цена сразу. Изготовление 3 рабочих дня.",
    },
    "/konstruktor/polotno": {
      title: "Свободное полотно: несколько надписей и фигур на одном трафарете",
      description: "Расставьте надписи, круг, звезду, сердце или рамку на одном листе. Перемычки ставим автоматически, тонкие места подсвечиваем, цена сразу.",
    },
    "/zahotovky": {
      title: "Заготовки из акрила, зеркального пластика и PET в ваш размер",
      description: "Круги, квадраты, сердца, звёзды, арки и другие формы из прозрачного, цветного и зеркального акрила, подложки под торт из PET и полистирола. Свой размер, цена за штуку сразу, опт от 10 шт.",
    },
    "/konstruktor/akrylovi-tsyfry-i-litery": {
      title: "Акриловые цифры и буквы от 2 до 80 см — конструктор с ценой",
      description: "Отдельные цифры и буквы из акрила 3 мм: номер дома, квартиры, дата, инициалы, декор. Высота от 2 до 80 см, любой цвет и шрифт, со скотчем или без. Цена сразу.",
    },
    "/konstruktor/inicialy-na-tort": {
      title: "Инициалы на свадебный торт из акрила — конструктор с ценой",
      description: "Инициалы молодожёнов на торт: две буквы с разделителем, свой шрифт, размер и цвет, зеркальный или цветной акрил. Отдельными деталями или на планке со шпажкой, цена сразу.",
    },
    "/konstruktor/samoklejni-litery-dlia-vyvisok": {
      title: "Самоклеящиеся буквы из акрила для вывесок и надписей — конструктор с ценой",
      description: "Отдельные заглавные и строчные буквы из акрила 3 мм со скотчем на обороте, от 2 до 20 см: надписи на витрину, стену, дверь, рекламу. Чёрные, белые, зеркальные золото, серебро, розовое золото. Цена каждой буквы сразу.",
    },
    "/konstruktor/samoklejni-litery": {
      title: "Самоклеящиеся буквы из акрила для коробки для открыток — конструктор с ценой",
      description: "Объёмные буквы из акрила 3 мм со скотчем на обороте: надпись на свадебную коробку для открыток, подарок или стол. Свой текст и шрифт для каждой строки, слитные или отдельные буквы, картонный трафарет в цене.",
    },
    "/vyvisky": {
      title: "Вывеска с логотипом из акрила — конструктор с ценой сразу",
      description: "Двухслойные вывески из акрила для салона, кофейни, офиса: ваш логотип, надпись, зеркальная рамка, круглая или прямоугольная форма, самоклейка или держатели. Цена сразу, изготовление 3 рабочих дня.",
    },
    "/vyvisky/napysy-na-plantsi": {
      title: "Надписи на планке из акрила — меню для кофейни, конструктор с ценой",
      description: "Слова из акрила, где буквы стоят на тонкой планке: каждое слово одной деталью. Меню с ценами, названия зон, надписи на стену. Свой шрифт, цвет и высота букв, цена сразу.",
    },
    "/vyvisky/nomerky": {
      title: "Номерки на дверь из двух слоёв акрила — конструктор, от 65 ₴",
      description: "Номерок для кабинета, квартиры или столика: два слоя акрила со сдвигом, номер вырезан в лицевом слое, клеевая основа. 8×8 см 65 ₴, набор номеров сразу.",
    },
    "/vyvisky/ofisni-tablychky": {
      title: "Офисная табличка с гравировкой — конструктор, цена сразу",
      description: "Табличка на дверь или стену: чёрная или белая основа, зеркальная пластина золото, серебро, бронзовое золото или сатин серебро с вашей надписью. 21×6 см от 220 ₴, клеевая основа 3M.",
    },
    "/vyvisky/tablychky-na-dveri": {
      title: "Таблички на дверь с зеркальной окантовкой — конструктор",
      description: "Табличка на дверь кабинета или салона: акриловая основа, золотая или серебряная зеркальная окантовка и объёмные буквы. Свой текст, шрифт и цвет, цена сразу.",
    },
    "/vyvisky/tablychky-poverkh": {
      title: "Таблички этажей «ЭТАЖ 1» для дома — конструктор, цена сразу",
      description: "Объёмные таблички этажа из акрила: белая или чёрная основа, надпись, номер и рамка из золотого или серебряного зеркального акрила. 13×18 см 360 ₴, набор на все этажи сразу.",
    },
    "/vyvisky/vkazivnyky": {
      title: "Табличка-указатель со стрелкой — конструктор, цена сразу",
      description: "Объёмная двухслойная табличка-стрелка с вашей надписью и логотипом: 25×10 см от 450 ₴, свой шрифт, цвет основы и надписи, направление влево или вправо. Изготовление 3 рабочих дня.",
    },
  },
  en: {
    "/konstruktor": {
      title: "Your own text stencil maker with preview and price",
      description: "Type your text, pick a font, size and material. We add stencil bridges to the letters automatically and show the price right away. Made in 3 business days.",
    },
    "/konstruktor/polotno": {
      title: "Free canvas: several texts and shapes on one stencil",
      description: "Place texts, a circle, star, heart or frame on one sheet. We add bridges automatically, highlight thin spots and show the price right away.",
    },
    "/zahotovky": {
      title: "Acrylic, mirror plastic and PET blanks cut to your size",
      description: "Circles, squares, hearts, stars, arches and other shapes in clear, colored and mirror acrylic, plus PET and polystyrene cake boards. Custom size, instant price per piece, bulk prices from 10 pcs.",
    },
    "/konstruktor/akrylovi-tsyfry-i-litery": {
      title: "Acrylic numbers and letters from 2 to 80 cm, with instant price",
      description: "Individual 3 mm acrylic numbers and letters: house or apartment number, date, initials, decor. Height from 2 to 80 cm, any color and font, with or without adhesive tape. Instant price.",
    },
    "/konstruktor/inicialy-na-tort": {
      title: "Acrylic wedding cake initials topper maker with price",
      description: "The couple's initials for the cake: two letters with a divider, your own font, size and color, mirror or colored acrylic. As separate pieces or on a bar with a skewer, instant price.",
    },
    "/konstruktor/samoklejni-litery-dlia-vyvisok": {
      title: "Self-adhesive acrylic letters for signs and lettering, with price",
      description: "Individual 3 mm acrylic capital and lowercase letters with tape on the back, 2 to 20 cm: lettering for shop windows, walls, doors and ads. Black, white, mirror gold, silver and rose gold. Price of every letter right away.",
    },
    "/konstruktor/samoklejni-litery": {
      title: "Self-adhesive acrylic letters for a card box, with price",
      description: "Raised 3 mm acrylic letters with tape on the back: lettering for a wedding card box, a gift or a table. Your own text and font for each line, joined or separate letters, cardboard placement stencil included.",
    },
    "/vyvisky": {
      title: "Acrylic logo sign maker with instant price",
      description: "Two-layer acrylic signs for salons, cafes and offices: your logo, text, mirror frame, round or rectangular shape, self-adhesive or standoff mounts. Instant price, made in 3 business days.",
    },
    "/vyvisky/napysy-na-plantsi": {
      title: "Acrylic words on a bar: cafe menu lettering, with price",
      description: "Acrylic words where the letters stand on a thin bar, each word in one piece. Menus with prices, zone names, wall lettering. Your own font, color and letter height, instant price.",
    },
    "/vyvisky/nomerky": {
      title: "Two-layer acrylic door numbers, from 65 ₴",
      description: "Number plates for offices, apartments or tables: two offset acrylic layers, the number cut into the top layer, adhesive back. 8×8 cm for 65 ₴, a full set of numbers at once.",
    },
    "/vyvisky/ofisni-tablychky": {
      title: "Engraved office plaque maker with instant price",
      description: "A plaque for a door or wall: black or white base, mirror plate in gold, silver, bronze gold or satin silver with your text. 21×6 cm from 220 ₴, 3M adhesive back.",
    },
    "/vyvisky/tablychky-na-dveri": {
      title: "Door plaques with mirror edging: online maker",
      description: "A door plaque for an office or salon: acrylic base, gold or silver mirror edging and raised letters. Your own text, font and color, instant price.",
    },
    "/vyvisky/tablychky-poverkh": {
      title: "“FLOOR 1” floor signs for buildings, with instant price",
      description: "Raised acrylic floor signs: white or black base, text, number and frame in gold or silver mirror acrylic. 13×18 cm for 360 ₴, a set for every floor at once.",
    },
    "/vyvisky/vkazivnyky": {
      title: "Arrow direction sign maker with instant price",
      description: "A raised two-layer arrow sign with your text and logo: 25×10 cm from 450 ₴, your own font, base and text colors, pointing left or right. Made in 3 business days.",
    },
  },
};
