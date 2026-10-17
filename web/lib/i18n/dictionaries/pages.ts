// Texts of small pages: the 404 page and the «Відгуки» page.

import type { Dictionary } from "../../../types/i18n";

export interface PagesTexts {
  notFoundTitle: string;
  notFoundCode: string;
  notFoundHeading: string;
  notFoundText: string;
  notFoundLinks: [string, string][];
  toHome: string;
  reviewsMetaTitle: string;
  reviewsMetaDescription: string;
  reviewsTitle: string;
  reviewsLead: string;
  reviewsPages: string;
  newer: string;
  older: string;
  pageOf: (page: number, pages: number) => string;
  reviewsSoon: string;
}

export const PAGES: Dictionary<PagesTexts> = {
  uk: {
    notFoundTitle: "Сторінку не знайдено",
    notFoundCode: "Помилка 404",
    notFoundHeading: "Такої сторінки немає",
    notFoundText: "Можливо, товар перейменували або адресу введено з помилкою. Скористайтеся пошуком угорі або оберіть розділ.",
    notFoundLinks: [
      ["Каталог трафаретів", "/catalog"],
      ["Свій напис на трафареті", "/konstruktor"],
      ["Трафарет за вашим макетом", "/na-zamovlennia"],
      ["Вивіски з акрилу", "/vyvisky"],
      ["Доставка і оплата", "/dostavka-i-oplata"],
      ["Контакти", "/kontakty"],
    ],
    toHome: "На головну",
    reviewsMetaTitle: "Відгуки покупців",
    reviewsMetaDescription: "Відгуки покупців Trafaret Line з фото: трафарети, заготовки з акрилу і ПЕТ, вивіски та написи.",
    reviewsTitle: "Відгуки покупців",
    reviewsLead: "Відгуки публікуємо після перевірки: лише від покупців, які отримали замовлення.",
    reviewsPages: "Сторінки відгуків",
    newer: "Новіші",
    older: "Старіші",
    pageOf: (page, pages) => `Сторінка ${page} з ${pages}`,
    reviewsSoon: "Відгуки скоро зʼявляться. Після отримання замовлення ми надсилаємо посилання, щоб ви могли поділитися враженнями і фото.",
  },
  ru: {
    notFoundTitle: "Страница не найдена",
    notFoundCode: "Ошибка 404",
    notFoundHeading: "Такой страницы нет",
    notFoundText: "Возможно, товар переименовали или адрес введён с ошибкой. Воспользуйтесь поиском вверху или выберите раздел.",
    notFoundLinks: [
      ["Каталог трафаретов", "/catalog"],
      ["Своя надпись на трафарете", "/konstruktor"],
      ["Трафарет по вашему макету", "/na-zamovlennia"],
      ["Вывески из акрила", "/vyvisky"],
      ["Доставка и оплата", "/dostavka-i-oplata"],
      ["Контакты", "/kontakty"],
    ],
    toHome: "На главную",
    reviewsMetaTitle: "Отзывы покупателей",
    reviewsMetaDescription: "Отзывы покупателей Trafaret Line с фото: трафареты, заготовки из акрила и ПЭТ, вывески и надписи.",
    reviewsTitle: "Отзывы покупателей",
    reviewsLead: "Отзывы публикуем после проверки: только от покупателей, которые получили заказ.",
    reviewsPages: "Страницы отзывов",
    newer: "Новее",
    older: "Старше",
    pageOf: (page, pages) => `Страница ${page} из ${pages}`,
    reviewsSoon: "Отзывы скоро появятся. После получения заказа мы присылаем ссылку, чтобы вы могли поделиться впечатлениями и фото.",
  },
};
