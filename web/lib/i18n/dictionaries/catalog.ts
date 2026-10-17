// Texts of the catalogue: catalogue and category pages, filters, product cards, the product
// page with its buy box (and the hole and monogram variants of it), reviews block and search.

import type { Dictionary } from "../../../types/i18n";
import type { HolePosition } from "../../../types/hole";
import type { MonogramField } from "../../../types/monogram";

export interface CatalogTexts {
  home: string;
  breadcrumbs: string;
  catalogTitle: string;
  catalogMetaTitle: string;
  catalogMetaDescription: string;
  hit: string;
  isNew: string;
  from: string;
  kinds: { ready: string; named: string; custom: string };
  filters: string;
  subcategories: string;
  material: string;
  type: string;
  removeFilter: string;
  sort: string;
  sortPopular: string;
  sortCheap: string;
  sortExpensive: string;
  nothingFiltered: string;
  nothingYet: string;
  nothingFilteredHint: string;
  nothingYetHint: string;
  resetFilters: string;
  ownText: string;
  productForms: [string, string, string];
  sizeForms: [string, string, string];
  showMore: (count: number, rest: number) => string;
  show: string;
  photo: string;
  sku: string;
  yourText: string;
  previewBeforeCut: string;
  size: string;
  priceByQty: string;
  piece: string;
  fromPieces: (qty: number) => string;
  less: string;
  more: string;
  quantity: string;
  soldOutNote: string;
  onOrderNote: string;
  makeOwn: string;
  make: string;
  soldOut: string;
  soldOutShort: string;
  added: string;
  buy: string;
  perks: [string, string, string];
  description: string;
  short: string;
  faq: string;
  related: string;
  reviews: string;
  reviewForms: [string, string, string];
  allReviews: string;
  noReviews: string;
  product: string;
  buyerPhoto: (n: number) => string;
  shopReply: string;
  rating: (value: string) => string;
  hole: string;
  holePosition: string;
  holePositions: Record<HolePosition, string>;
  holePositionsInText: Record<HolePosition, string>;
  holeDiameter: string;
  holeSummary: (diameter: string, position: string) => string;
  holeHelp: (min: string, max: string) => string;
  holeNotNumber: string;
  holeTooSmall: (min: string) => string;
  holeTooLarge: (max: string) => string;
  holeChoosePosition: string;
  holeCircle: (cm: number) => string;
  holeCircleWithHole: (cm: number, diameter: string) => string;
  monogramFields: Record<MonogramField, string>;
  monogramStyle: string;
  monogramPreviewNote: string;
  monogramView: string;
  monogramStencil: string;
  monogramCookie: string;
  /** Messages of lib/monogram/check-input.ts (written in Ukrainian) in this language. */
  monogramErrors: Record<string, string>;
  monogramFontsFailed: string;
  monogramPreviewFailed: string;
  monogramPreviewLabel: (w: number, h: number, text: string) => string;
  monogramBuilding: string;
  monogramMissing: (chars: string) => string;
  monogramSmallDate: string;
  searchMetaTitle: string;
  searchMetaDescription: string;
  searchTitle: string;
  searchFor: (query: string) => string;
  searchFailed: string;
  searchTooShort: string;
  searchNothing: (query: string) => string;
  searchNothingHint: string;
  toCatalog: string;
}

const mmText = (value: string) => `${value} мм`;

export const CATALOG: Dictionary<CatalogTexts> = {
  uk: {
    home: "Головна",
    breadcrumbs: "Хлібні крихти",
    catalogTitle: "Каталог",
    catalogMetaTitle: "Каталог трафаретів: стіни, штукатурка, торти, свята, заготовки",
    catalogMetaDescription: "Усі розділи Trafaret Line: трафарети для стін і штукатурки, для тортів і кави, свята, літери, камуфляж, бізнес і заготовки з акрилу та PET.",
    hit: "Хіт",
    isNew: "Новинка",
    from: "від",
    kinds: { ready: "Готовий малюнок", named: "З вашим текстом", custom: "За вашим макетом" },
    filters: "Фільтри",
    subcategories: "Підкатегорії",
    material: "Матеріал",
    type: "Тип",
    removeFilter: "Прибрати фільтр",
    sort: "Сортування",
    sortPopular: "Популярні",
    sortCheap: "Ціна ↑",
    sortExpensive: "Ціна ↓",
    nothingFiltered: "Нічого не знайшли з такими фільтрами",
    nothingYet: "У цьому розділі товари ще готуються",
    nothingFilteredHint: "Приберіть частину фільтрів або зробіть свій трафарет з текстом.",
    nothingYetHint: "Зробіть свій трафарет у конструкторі або надішліть нам свій макет.",
    resetFilters: "Скинути фільтри",
    ownText: "Свій напис",
    productForms: ["товар", "товари", "товарів"],
    sizeForms: ["розмір", "розміри", "розмірів"],
    showMore: (count, rest) => `Показати ще ${count} з ${rest}`,
    show: "Показати",
    photo: "Фото",
    sku: "Артикул",
    yourText: "Ваш текст",
    previewBeforeCut: "Перед порізкою надішлемо превʼю з вашим текстом у Viber або Telegram.",
    size: "Розмір",
    priceByQty: "Ціна від кількості",
    piece: "1 шт.",
    fromPieces: (qty) => `від ${qty} шт.`,
    less: "Менше",
    more: "Більше",
    quantity: "Кількість",
    soldOutNote: "Зараз немає в наявності. Напишіть нам у Viber, повідомимо, коли зʼявиться.",
    onOrderNote: "Під замовлення: строк виготовлення уточнить менеджер.",
    makeOwn: "Створити зі своїм написом",
    make: "Створити",
    soldOut: "Немає в наявності",
    soldOutShort: "Немає",
    added: "✓ Додано",
    buy: "Купити",
    perks: ["Нова пошта, Укрпошта", "Оплата карткою, Apple Pay, Google Pay або при отриманні", "Обмін і повернення 14 днів, індивідуальні вироби — якщо брак"],
    description: "Опис",
    short: "Коротко",
    faq: "Питання і відповіді",
    related: "Пасує разом",
    reviews: "Відгуки",
    reviewForms: ["відгук", "відгуки", "відгуків"],
    allReviews: "Усі відгуки покупців",
    noReviews: "Відгуків про цей товар ще немає. Після отримання замовлення ми надішлемо посилання, щоб ви могли поділитися враженнями і фото.",
    product: "Товар",
    buyerPhoto: (n) => `Фото покупця ${n}`,
    shopReply: "Відповідь Trafaret Line:",
    rating: (value) => `Оцінка ${value} з 5`,
    hole: "Отвір",
    holePosition: "Розташування отвору",
    holePositions: { top: "Зверху", bottom: "Знизу", left: "Зліва", right: "Справа", center: "По центру" },
    holePositionsInText: { top: "зверху", bottom: "знизу", left: "зліва", right: "справа", center: "по центру" },
    holeDiameter: "Діаметр отвору, мм",
    holeSummary: (diameter, position) => `отвір Ø${mmText(diameter)} ${position}`,
    holeHelp: (min, max) => `Від ${min} до ${mmText(max)} на цьому колі. Ціна не змінюється.`,
    holeNotNumber: "Вкажіть діаметр числом, наприклад 5 або 5,5.",
    holeTooSmall: (min) => `Найменший отвір — ${mmText(min)}.`,
    holeTooLarge: (max) => `На цьому колі отвір до ${mmText(max)}, щоб краї не зламались.`,
    holeChoosePosition: "Оберіть розташування отвору.",
    holeCircle: (cm) => `Коло Ø${cm} см`,
    holeCircleWithHole: (cm, diameter) => `Коло Ø${cm} см з отвором Ø${mmText(diameter)}`,
    monogramFields: { first: "Перша літера", second: "Друга літера", date: "Дата" },
    monogramStyle: "Шаблон",
    monogramPreviewNote: "Превʼю показує справжню порізку з перемичками. Перед порізкою надішлемо макет у Viber або Telegram.",
    monogramView: "Вигляд превʼю",
    monogramStencil: "Трафарет",
    monogramCookie: "На прянику",
    monogramErrors: {},
    monogramFontsFailed: "Не вдалося завантажити шрифти. Оновіть сторінку.",
    monogramPreviewFailed: "Превʼю не побудувалося. Спробуйте інші літери.",
    monogramPreviewLabel: (w, h, text) => `Превʼю трафарету ${w} × ${h} см: ${text}`,
    monogramBuilding: "Будуємо превʼю…",
    monogramMissing: (chars) => `Цих знаків немає в шрифті: ${chars}. Введіть українську, російську або латинську літеру.`,
    monogramSmallDate: "На цьому розмірі дата дуже дрібна. Для чіткої дати оберіть від 8 × 8 см або коротку дату, наприклад 27.09.26.",
    searchMetaTitle: "Пошук трафаретів",
    searchMetaDescription: "Пошук по каталогу трафаретів і заготовок Trafaret Line.",
    searchTitle: "Пошук по каталогу",
    searchFor: (query) => `Пошук: «${query}»`,
    searchFailed: "Каталог зараз недоступний. Спробуйте ще раз за хвилину.",
    searchTooShort: "Введіть щонайменше 2 літери, наприклад «мандала» або «цифри».",
    searchNothing: (query) => `За запитом «${query}» нічого не знайшли.`,
    searchNothingHint: "Спробуйте інше слово або зробіть свій трафарет з текстом.",
    toCatalog: "До каталогу",
  },
  ru: {
    home: "Главная",
    breadcrumbs: "Хлебные крошки",
    catalogTitle: "Каталог",
    catalogMetaTitle: "Каталог трафаретов: стены, штукатурка, торты, праздники, заготовки",
    catalogMetaDescription: "Все разделы Trafaret Line: трафареты для стен и штукатурки, для тортов и кофе, праздники, буквы, камуфляж, бизнес и заготовки из акрила и PET.",
    hit: "Хит",
    isNew: "Новинка",
    from: "от",
    kinds: { ready: "Готовый рисунок", named: "С вашим текстом", custom: "По вашему макету" },
    filters: "Фильтры",
    subcategories: "Подкатегории",
    material: "Материал",
    type: "Тип",
    removeFilter: "Убрать фильтр",
    sort: "Сортировка",
    sortPopular: "Популярные",
    sortCheap: "Цена ↑",
    sortExpensive: "Цена ↓",
    nothingFiltered: "Ничего не нашли с такими фильтрами",
    nothingYet: "В этом разделе товары ещё готовятся",
    nothingFilteredHint: "Уберите часть фильтров или сделайте свой трафарет с текстом.",
    nothingYetHint: "Сделайте свой трафарет в конструкторе или пришлите нам свой макет.",
    resetFilters: "Сбросить фильтры",
    ownText: "Своя надпись",
    productForms: ["товар", "товара", "товаров"],
    sizeForms: ["размер", "размера", "размеров"],
    showMore: (count, rest) => `Показать ещё ${count} из ${rest}`,
    show: "Показать",
    photo: "Фото",
    sku: "Артикул",
    yourText: "Ваш текст",
    previewBeforeCut: "Перед порезкой пришлём превью с вашим текстом в Viber или Telegram.",
    size: "Размер",
    priceByQty: "Цена от количества",
    piece: "1 шт.",
    fromPieces: (qty) => `от ${qty} шт.`,
    less: "Меньше",
    more: "Больше",
    quantity: "Количество",
    soldOutNote: "Сейчас нет в наличии. Напишите нам в Viber, сообщим, когда появится.",
    onOrderNote: "Под заказ: срок изготовления уточнит менеджер.",
    makeOwn: "Создать со своей надписью",
    make: "Создать",
    soldOut: "Нет в наличии",
    soldOutShort: "Нет",
    added: "✓ Добавлено",
    buy: "Купить",
    perks: ["Новая почта, Укрпочта", "Оплата картой, Apple Pay, Google Pay или при получении", "Обмен и возврат 14 дней, индивидуальные изделия — если брак"],
    description: "Описание",
    short: "Коротко",
    faq: "Вопросы и ответы",
    related: "Подходит вместе",
    reviews: "Отзывы",
    reviewForms: ["отзыв", "отзыва", "отзывов"],
    allReviews: "Все отзывы покупателей",
    noReviews: "Отзывов об этом товаре ещё нет. После получения заказа мы пришлём ссылку, чтобы вы могли поделиться впечатлениями и фото.",
    product: "Товар",
    buyerPhoto: (n) => `Фото покупателя ${n}`,
    shopReply: "Ответ Trafaret Line:",
    rating: (value) => `Оценка ${value} из 5`,
    hole: "Отверстие",
    holePosition: "Расположение отверстия",
    holePositions: { top: "Сверху", bottom: "Снизу", left: "Слева", right: "Справа", center: "По центру" },
    holePositionsInText: { top: "сверху", bottom: "снизу", left: "слева", right: "справа", center: "по центру" },
    holeDiameter: "Диаметр отверстия, мм",
    holeSummary: (diameter, position) => `отверстие Ø${mmText(diameter)} ${position}`,
    holeHelp: (min, max) => `От ${min} до ${mmText(max)} на этом круге. Цена не меняется.`,
    holeNotNumber: "Укажите диаметр числом, например 5 или 5,5.",
    holeTooSmall: (min) => `Наименьшее отверстие — ${mmText(min)}.`,
    holeTooLarge: (max) => `На этом круге отверстие до ${mmText(max)}, чтобы края не сломались.`,
    holeChoosePosition: "Выберите расположение отверстия.",
    holeCircle: (cm) => `Круг Ø${cm} см`,
    holeCircleWithHole: (cm, diameter) => `Круг Ø${cm} см с отверстием Ø${mmText(diameter)}`,
    monogramFields: { first: "Первая буква", second: "Вторая буква", date: "Дата" },
    monogramStyle: "Шаблон",
    monogramPreviewNote: "Превью показывает настоящую порезку с перемычками. Перед порезкой пришлём макет в Viber или Telegram.",
    monogramView: "Вид превью",
    monogramStencil: "Трафарет",
    monogramCookie: "На прянике",
    monogramErrors: {
      "Вкажіть дату": "Укажите дату",
      "Лише цифри та крапки, наприклад 27.09.2026": "Только цифры и точки, например 27.09.2026",
      "Вкажіть літеру": "Укажите букву",
      "Одна літера: українська, російська або латинська": "Одна буква: украинская, русская или латинская",
    },
    monogramFontsFailed: "Не удалось загрузить шрифты. Обновите страницу.",
    monogramPreviewFailed: "Превью не построилось. Попробуйте другие буквы.",
    monogramPreviewLabel: (w, h, text) => `Превью трафарета ${w} × ${h} см: ${text}`,
    monogramBuilding: "Строим превью…",
    monogramMissing: (chars) => `Этих знаков нет в шрифте: ${chars}. Введите украинскую, русскую или латинскую букву.`,
    monogramSmallDate: "На этом размере дата очень мелкая. Для чёткой даты выберите от 8 × 8 см или короткую дату, например 27.09.26.",
    searchMetaTitle: "Поиск трафаретов",
    searchMetaDescription: "Поиск по каталогу трафаретов и заготовок Trafaret Line.",
    searchTitle: "Поиск по каталогу",
    searchFor: (query) => `Поиск: «${query}»`,
    searchFailed: "Каталог сейчас недоступен. Попробуйте ещё раз через минуту.",
    searchTooShort: "Введите хотя бы 2 буквы, например «мандала» или «цифры».",
    searchNothing: (query) => `По запросу «${query}» ничего не нашли.`,
    searchNothingHint: "Попробуйте другое слово или сделайте свой трафарет с текстом.",
    toCatalog: "В каталог",
  },
};
