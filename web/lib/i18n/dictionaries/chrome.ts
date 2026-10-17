// Texts of the site frame: trust bar, header, direction tabs, footer, bottom navigation.

import type { Dictionary } from "../../../types/i18n";

export interface ChromeTexts {
  trust: string;
  infoNav: string;
  info: [string, string][];
  catalog: string;
  searchPrefix: string;
  searchHints: string[];
  searchLabel: string;
  searchSubmit: string;
  cabinet: string;
  directionsNav: string;
  stencils: string;
  blanks: string;
  footerAbout: string;
  footerColumns: { title: string; links: [string, string][] }[];
  mobileNav: string;
  bottom: [string, string, string][];
  languageNav: string;
}

const PATHS = {
  home: "M3 11l9-7 9 7v9H5v-9",
  catalog: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  own: "M4 20l4-1 11-11-3-3L5 16z",
  cart: "M4 5h2l2 11h11l2-8H7",
  contacts: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-4 4-6 8-6s7 2 8 6",
};

export const CHROME: Dictionary<ChromeTexts> = {
  uk: {
    trust: "Виготовлення 3 робочі дні · Нова пошта по всій Україні · Оплата при отриманні",
    infoNav: "Інформація",
    info: [["Про нас", "/pro-nas"], ["Доставка і оплата", "/dostavka-i-oplata"], ["Обмін і повернення", "/povernennia"], ["Для бізнесу", "/business"], ["Відгуки", "/vidguky"], ["Контакти", "/kontakty"]],
    catalog: "Каталог",
    searchPrefix: "Знайти трафарет",
    searchHints: ["мандала", "цифри 10 см", "напис на торт", "піксель ЗСУ", "акрил 3 мм коло", "номер підʼїзду"],
    searchLabel: "Пошук по каталогу",
    searchSubmit: "Знайти",
    cabinet: "Мій кабінет",
    directionsNav: "Напрямки",
    stencils: "Трафарети",
    blanks: "Акрил і ПЕТ",
    footerAbout: "Трафарети і заготовки від виробника. Бориспіль · Запоріжжя.",
    footerColumns: [
      { title: "Каталог", links: [["Трафарети", "/catalog"], ["Заготовки з акрилу і PET", "/blanks"], ["Заготовки у свій розмір", "/zahotovky"], ["Свій напис", "/konstruktor"], ["Вільне полотно", "/konstruktor/polotno"]] },
      { title: "Покупцям", links: [["Доставка і оплата", "/dostavka-i-oplata"], ["Обмін і повернення", "/povernennia"], ["За вашим макетом", "/na-zamovlennia"], ["Вивіски", "/vyvisky"], ["Таблички-вказівники", "/vyvisky/vkazivnyky"], ["Офісні таблички", "/vyvisky/ofisni-tablychky"], ["Написи на планці", "/vyvisky/napysy-na-plantsi"], ["Таблички поверхів", "/vyvisky/tablychky-poverkh"], ["Таблички на двері", "/vyvisky/tablychky-na-dveri"], ["Номерки", "/vyvisky/nomerky"], ["Ініціали на торт", "/konstruktor/inicialy-na-tort"], ["Самоклейні літери", "/konstruktor/samoklejni-litery"], ["Акрилові цифри і літери", "/konstruktor/akrylovi-tsyfry-i-litery"], ["Літери для вивісок", "/konstruktor/samoklejni-litery-dlia-vyvisok"]] },
      { title: "Компанія", links: [["Про нас", "/pro-nas"], ["Для бізнесу", "/business"], ["Відгуки", "/vidguky"], ["Контакти", "/kontakty"], ["Публічна оферта", "/oferta"], ["Політика конфіденційності", "/polityka-konfidentsiinosti"]] },
    ],
    mobileNav: "Мобільне меню",
    bottom: [["Головна", "/", PATHS.home], ["Каталог", "/catalog", PATHS.catalog], ["Свій напис", "/konstruktor", PATHS.own], ["Кошик", "/checkout", PATHS.cart], ["Контакти", "/kontakty", PATHS.contacts]],
    languageNav: "Мова сайту",
  },
  ru: {
    trust: "Изготовление 3 рабочих дня · Новая почта по всей Украине · Оплата при получении",
    infoNav: "Информация",
    info: [["О нас", "/pro-nas"], ["Доставка и оплата", "/dostavka-i-oplata"], ["Обмен и возврат", "/povernennia"], ["Для бизнеса", "/business"], ["Отзывы", "/vidguky"], ["Контакты", "/kontakty"]],
    catalog: "Каталог",
    searchPrefix: "Найти трафарет",
    searchHints: ["мандала", "цифры 10 см", "надпись на торт", "пиксель ВСУ", "акрил 3 мм круг", "номер подъезда"],
    searchLabel: "Поиск по каталогу",
    searchSubmit: "Найти",
    cabinet: "Мой кабинет",
    directionsNav: "Направления",
    stencils: "Трафареты",
    blanks: "Акрил и ПЭТ",
    footerAbout: "Трафареты и заготовки от производителя. Борисполь · Запорожье.",
    footerColumns: [
      { title: "Каталог", links: [["Трафареты", "/catalog"], ["Заготовки из акрила и PET", "/blanks"], ["Заготовки в свой размер", "/zahotovky"], ["Своя надпись", "/konstruktor"], ["Свободный холст", "/konstruktor/polotno"]] },
      { title: "Покупателям", links: [["Доставка и оплата", "/dostavka-i-oplata"], ["Обмен и возврат", "/povernennia"], ["По вашему макету", "/na-zamovlennia"], ["Вывески", "/vyvisky"], ["Таблички-указатели", "/vyvisky/vkazivnyky"], ["Офисные таблички", "/vyvisky/ofisni-tablychky"], ["Надписи на планке", "/vyvisky/napysy-na-plantsi"], ["Таблички этажей", "/vyvisky/tablychky-poverkh"], ["Таблички на двери", "/vyvisky/tablychky-na-dveri"], ["Номерки", "/vyvisky/nomerky"], ["Инициалы на торт", "/konstruktor/inicialy-na-tort"], ["Самоклеящиеся буквы", "/konstruktor/samoklejni-litery"], ["Акриловые цифры и буквы", "/konstruktor/akrylovi-tsyfry-i-litery"], ["Буквы для вывесок", "/konstruktor/samoklejni-litery-dlia-vyvisok"]] },
      { title: "Компания", links: [["О нас", "/pro-nas"], ["Для бизнеса", "/business"], ["Отзывы", "/vidguky"], ["Контакты", "/kontakty"], ["Публичная оферта", "/oferta"], ["Политика конфиденциальности", "/polityka-konfidentsiinosti"]] },
    ],
    mobileNav: "Мобильное меню",
    bottom: [["Главная", "/", PATHS.home], ["Каталог", "/catalog", PATHS.catalog], ["Своя надпись", "/konstruktor", PATHS.own], ["Корзина", "/checkout", PATHS.cart], ["Контакты", "/kontakty", PATHS.contacts]],
    languageNav: "Язык сайта",
  },
};
