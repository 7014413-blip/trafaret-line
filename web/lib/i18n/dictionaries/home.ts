// Texts of the home page and its blocks (product rail, catalogue rail, blanks calculator).

import type { Dictionary } from "../../../types/i18n";

export interface HomeTexts {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroLead: string;
  heroCatalog: string;
  heroOwn: string;
  heroFacts: [bold: string, rest: string][];
  heroCities: string;
  heroAnimation: string;
  heroSample: string;
  from: string;
  scenariosNav: string;
  ideasTitle: string;
  howTitle: string;
  howSteps: [title: string, text: string][];
  catalog: string;
  railTitle: string;
  railAll: string;
  scrollLeft: string;
  scrollRight: string;
  sizeForms: [string, string, string];
  materialForms: [string, string, string];
  blanksTitle: string;
  blanksLead: string;
  shape: string;
  material: string;
  size: string;
  shapes: { circle: string; square: string; rect: string };
  perPiece: string;
  fromTen: string;
  perPieceShort: string;
  blanksButton: string;
}

export const HOME: Dictionary<HomeTexts> = {
  uk: {
    metaTitle: "Trafaret Line — трафарети від виробника",
    metaDescription: "Трафарети для стін, штукатурки, тортів і бізнесу від виробника. Свій напис з превʼю, заготовки з акрилу та ПЕТ. Виготовлення 3 робочі дні.",
    heroTitle: "Візерунок на стіні",
    heroTitleAccent: "за один вечір",
    heroLead: "Трафарети від виробника для стін, меблів, тортів і бізнесу. Обирайте з каталогу або впишіть свій текст і одразу побачите ціну.",
    heroCatalog: "Обрати трафарет",
    heroOwn: "Зробити свій →",
    heroFacts: [["від 150 ₴", "за трафарет"], ["до 1,4 × 2 м", "одним листом"], ["3 дні", "виготовлення"]],
    heroCities: "Бориспіль · Запоріжжя",
    heroAnimation: "Анімація: трафарет фарбують і знімають зі стіни",
    heroSample: "Мандала 60×60 · PET 0,5 мм",
    from: "від",
    scenariosNav: "Сценарії",
    ideasTitle: "Ідеї, з чого почати",
    howTitle: "Як це працює",
    howSteps: [
      ["Оберіть рисунок або впишіть текст", "Розмір і матеріал кнопками, ціна одразу."],
      ["Оформіть за хвилину", "Телефон, імʼя, відділення Нової пошти."],
      ["Фарбуйте за вечір", "Виготовимо за 3 робочі дні, відправимо з найближчого філіалу."],
    ],
    catalog: "Каталог",
    railTitle: "Обирайте за задачею",
    railAll: "Увесь розділ",
    scrollLeft: "Гортати вліво",
    scrollRight: "Гортати вправо",
    sizeForms: ["розмір", "розміри", "розмірів"],
    materialForms: ["матеріал", "матеріали", "матеріалів"],
    blanksTitle: "Заготовки з акрилу та ПЕТ у ваш розмір",
    blanksLead: "Кола, квадрати, прямокутники. Ціна за штуку одразу, опт від 10 шт.",
    shape: "Форма",
    material: "Матеріал",
    size: "Розмір",
    shapes: { circle: "● Коло", square: "■ Квадрат", rect: "▬ Прямокутник" },
    perPiece: "за 1 шт.",
    fromTen: "від 10 шт.",
    perPieceShort: "за шт.",
    blanksButton: "Обрати форму і колір",
  },
  ru: {
    metaTitle: "Trafaret Line — трафареты от производителя",
    metaDescription: "Трафареты для стен, штукатурки, тортов и бизнеса от производителя. Своя надпись с превью, заготовки из акрила и ПЭТ. Изготовление 3 рабочих дня.",
    heroTitle: "Узор на стене",
    heroTitleAccent: "за один вечер",
    heroLead: "Трафареты от производителя для стен, мебели, тортов и бизнеса. Выбирайте в каталоге или впишите свой текст и сразу увидите цену.",
    heroCatalog: "Выбрать трафарет",
    heroOwn: "Сделать свой →",
    heroFacts: [["от 150 ₴", "за трафарет"], ["до 1,4 × 2 м", "одним листом"], ["3 дня", "изготовление"]],
    heroCities: "Борисполь · Запорожье",
    heroAnimation: "Анимация: трафарет красят и снимают со стены",
    heroSample: "Мандала 60×60 · PET 0,5 мм",
    from: "от",
    scenariosNav: "Сценарии",
    ideasTitle: "Идеи, с чего начать",
    howTitle: "Как это работает",
    howSteps: [
      ["Выберите рисунок или впишите текст", "Размер и материал кнопками, цена сразу."],
      ["Оформите за минуту", "Телефон, имя, отделение Новой почты."],
      ["Красьте за вечер", "Изготовим за 3 рабочих дня, отправим из ближайшего филиала."],
    ],
    catalog: "Каталог",
    railTitle: "Выбирайте по задаче",
    railAll: "Весь раздел",
    scrollLeft: "Листать влево",
    scrollRight: "Листать вправо",
    sizeForms: ["размер", "размера", "размеров"],
    materialForms: ["материал", "материала", "материалов"],
    blanksTitle: "Заготовки из акрила и ПЭТ в ваш размер",
    blanksLead: "Круги, квадраты, прямоугольники. Цена за штуку сразу, опт от 10 шт.",
    shape: "Форма",
    material: "Материал",
    size: "Размер",
    shapes: { circle: "● Круг", square: "■ Квадрат", rect: "▬ Прямоугольник" },
    perPiece: "за 1 шт.",
    fromTen: "от 10 шт.",
    perPieceShort: "за шт.",
    blanksButton: "Выбрать форму и цвет",
  },
  en: {
    metaTitle: "Trafaret Line — stencils from the maker",
    metaDescription: "Stencils for walls, plaster, cakes and business, made by us. Your own text with a preview, acrylic and PET blanks. Made in 3 business days.",
    heroTitle: "A pattern on your wall",
    heroTitleAccent: "in one evening",
    heroLead: "Stencils from the maker for walls, furniture, cakes and business. Pick one from the catalog or type your own text and see the price right away.",
    heroCatalog: "Choose a stencil",
    heroOwn: "Make your own →",
    heroFacts: [["from 150 ₴", "per stencil"], ["up to 1.4 × 2 m", "in one sheet"], ["3 days", "to make"]],
    heroCities: "Boryspil · Zaporizhzhia",
    heroAnimation: "Animation: a stencil is painted over and peeled off the wall",
    heroSample: "Mandala 60×60 · PET 0.5 mm",
    from: "from",
    scenariosNav: "Ideas",
    ideasTitle: "Ideas to get started",
    howTitle: "How it works",
    howSteps: [
      ["Pick a design or type your text", "Choose size and material with buttons, see the price instantly."],
      ["Order in a minute", "Phone, name and a Nova Poshta branch."],
      ["Paint in one evening", "We make it in 3 business days and ship from the nearest branch."],
    ],
    catalog: "Catalog",
    railTitle: "Shop by task",
    railAll: "Whole section",
    scrollLeft: "Scroll left",
    scrollRight: "Scroll right",
    sizeForms: ["size", "sizes", "sizes"],
    materialForms: ["material", "materials", "materials"],
    blanksTitle: "Acrylic and PET blanks in your size",
    blanksLead: "Circles, squares, rectangles. Price per piece right away, bulk from 10 pcs.",
    shape: "Shape",
    material: "Material",
    size: "Size",
    shapes: { circle: "● Circle", square: "■ Square", rect: "▬ Rectangle" },
    perPiece: "per piece",
    fromTen: "from 10 pcs",
    perPieceShort: "/ pc",
    blanksButton: "Choose shape and color",
  },
};
