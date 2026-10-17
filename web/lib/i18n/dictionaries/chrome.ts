// Texts of the site frame: trust bar, header, direction tabs, footer, bottom navigation.

import type { Dictionary } from "../../../types/i18n";
import { SELLER } from "../../knowledge-base/seller-rules";

/** Cookie banner and the footer button that opens it again. */
export interface CookieTexts {
  settings: string;
  text: string;
  more: string;
  accept: string;
  necessaryOnly: string;
}

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
  cookies: CookieTexts;
  /** Seller line of the footer: the registered name stays as registered, the tax note is translated. */
  seller: string;
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
    seller: `${SELLER.legalName}, ${SELLER.taxNote}`,
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
    cookies: {
      settings: "Налаштування cookies",
      text: "Ми використовуємо cookies для аналітики та реклами, щоб показувати вам доречні товари. Необхідні cookies (кошик, вхід) працюють завжди.",
      more: "Докладніше",
      accept: "Прийняти",
      necessaryOnly: "Лише необхідні",
    },
  },
  ru: {
    seller: `${SELLER.legalName}, 2 группа, без НДС`,
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
    cookies: {
      settings: "Настройки cookies",
      text: "Мы используем cookies для аналитики и рекламы, чтобы показывать вам подходящие товары. Необходимые cookies (корзина, вход) работают всегда.",
      more: "Подробнее",
      accept: "Принять",
      necessaryOnly: "Только необходимые",
    },
  },
  en: {
    seller: "FOP Berchuk Natalia Leonidivna (sole proprietor), single tax group 2, not a VAT payer",
    trust: "Made in 3 business days · Nova Poshta delivery across Ukraine · Pay on delivery",
    infoNav: "Information",
    info: [["About us", "/pro-nas"], ["Delivery and payment", "/dostavka-i-oplata"], ["Exchanges and returns", "/povernennia"], ["For business", "/business"], ["Reviews", "/vidguky"], ["Contacts", "/kontakty"]],
    catalog: "Catalog",
    searchPrefix: "Find a stencil",
    searchHints: ["mandala", "numbers 10 cm", "cake lettering", "pixel camo", "acrylic 3 mm circle", "entrance number"],
    searchLabel: "Search the catalog",
    searchSubmit: "Search",
    cabinet: "My account",
    directionsNav: "Sections",
    stencils: "Stencils",
    blanks: "Acrylic and PET",
    footerAbout: "Stencils and blanks direct from the maker. Boryspil · Zaporizhzhia.",
    footerColumns: [
      { title: "Catalog", links: [["Stencils", "/catalog"], ["Acrylic and PET blanks", "/blanks"], ["Custom-size blanks", "/zahotovky"], ["Your own text", "/konstruktor"], ["Free canvas", "/konstruktor/polotno"]] },
      { title: "For customers", links: [["Delivery and payment", "/dostavka-i-oplata"], ["Exchanges and returns", "/povernennia"], ["From your design", "/na-zamovlennia"], ["Signs", "/vyvisky"], ["Direction signs", "/vyvisky/vkazivnyky"], ["Office plaques", "/vyvisky/ofisni-tablychky"], ["Words on a bar", "/vyvisky/napysy-na-plantsi"], ["Floor signs", "/vyvisky/tablychky-poverkh"], ["Door signs", "/vyvisky/tablychky-na-dveri"], ["Number plaques", "/vyvisky/nomerky"], ["Cake initials", "/konstruktor/inicialy-na-tort"], ["Self-adhesive letters", "/konstruktor/samoklejni-litery"], ["Acrylic numbers and letters", "/konstruktor/akrylovi-tsyfry-i-litery"], ["Letters for signs", "/konstruktor/samoklejni-litery-dlia-vyvisok"]] },
      { title: "Company", links: [["About us", "/pro-nas"], ["For business", "/business"], ["Reviews", "/vidguky"], ["Contacts", "/kontakty"], ["Public offer", "/oferta"], ["Privacy policy", "/polityka-konfidentsiinosti"]] },
    ],
    mobileNav: "Mobile menu",
    bottom: [["Home", "/", PATHS.home], ["Catalog", "/catalog", PATHS.catalog], ["Your text", "/konstruktor", PATHS.own], ["Cart", "/checkout", PATHS.cart], ["Contacts", "/kontakty", PATHS.contacts]],
    languageNav: "Site language",
    cookies: {
      settings: "Cookie settings",
      text: "We use cookies for analytics and ads to show you products that fit. Essential cookies (cart, sign-in) are always on.",
      more: "Learn more",
      accept: "Accept",
      necessaryOnly: "Essential only",
    },
  },
};
