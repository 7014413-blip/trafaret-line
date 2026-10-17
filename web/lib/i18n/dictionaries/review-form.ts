// Texts of the review form a buyer opens by the manager's link (/vidguk/<order id>). The form
// checks, the photo reducer and the shop write their messages in Ukrainian; `messages` gives
// them in this language.

import type { Dictionary } from "../../../types/i18n";

export interface ReviewFormTexts {
  title: string;
  lead: string;
  badLinkStart: string;
  contacts: string;
  badLinkEnd: string;
  order: (number: string) => string;
  subject: string;
  wholeOrder: (title: string) => string;
  reviewed: string;
  rating: string;
  ratingWords: [string, string, string, string, string];
  ratingOf: (n: number, word: string) => string;
  yourReview: string;
  placeholder: string;
  name: string;
  city: string;
  optional: string;
  photos: string;
  photosUpTo: (max: number) => string;
  photosMax: (max: number) => string;
  processing: string;
  addMore: string;
  addPhotos: string;
  yourPhoto: (n: number) => string;
  removePhoto: (n: number) => string;
  wait: string;
  send: string;
  thanksPending: string;
  thanks: string;
  allSent: string;
  afterCheck: string;
  /** Ukrainian messages of the form checks, the photo reducer and the shop → this language. */
  messages: Record<string, string>;
}

export const REVIEW_FORM: Dictionary<ReviewFormTexts> = {
  uk: {
    title: "Відгук про замовлення",
    lead: "Розкажіть, як вам наша робота. Найкраще — з фото результату: воно допоможе іншим покупцям обрати.",
    badLinkStart: "Посилання недійсне або застаріло. Напишіть нам на сторінці ",
    contacts: "Контакти",
    badLinkEnd: ", і ми надішлемо нове.",
    order: (number) => `Замовлення ${number}`,
    subject: "Про що відгук",
    wholeOrder: (title) => `Замовлення в цілому: ${title}`,
    reviewed: "Відгук надіслано",
    rating: "Оцінка",
    ratingWords: ["Погано", "Так собі", "Нормально", "Добре", "Чудово"],
    ratingOf: (n, word) => `${n} з 5 — ${word}`,
    yourReview: "Ваш відгук",
    placeholder: "Як вам трафарет: якість, розмір, як вийшов результат?",
    name: "Імʼя",
    city: "Місто",
    optional: "(необовʼязково)",
    photos: "Фото результату",
    photosUpTo: (max) => `(до ${max}, необовʼязково)`,
    photosMax: (max) => `Можна додати до ${max} фото`,
    processing: "Обробляємо фото…",
    addMore: "Додати ще фото",
    addPhotos: "Додати фото",
    yourPhoto: (n) => `Ваше фото ${n}`,
    removePhoto: (n) => `Прибрати фото ${n}`,
    wait: "Зачекайте…",
    send: "Надіслати відгук",
    thanksPending: "Дякуємо! Відгук зʼявиться на сайті після перевірки.",
    thanks: "Дякуємо за відгук!",
    allSent: "Відгуки на це замовлення вже надіслані",
    afterCheck: "Він зʼявиться на сайті після перевірки. Нам дуже важливо знати, як вам наша робота.",
    messages: {},
  },
  ru: {
    title: "Отзыв о заказе",
    lead: "Расскажите, как вам наша работа. Лучше всего — с фото результата: оно поможет другим покупателям выбрать.",
    badLinkStart: "Ссылка недействительна или устарела. Напишите нам на странице ",
    contacts: "Контакты",
    badLinkEnd: ", и мы пришлём новую.",
    order: (number) => `Заказ ${number}`,
    subject: "О чём отзыв",
    wholeOrder: (title) => `Заказ в целом: ${title}`,
    reviewed: "Отзыв отправлен",
    rating: "Оценка",
    ratingWords: ["Плохо", "Так себе", "Нормально", "Хорошо", "Отлично"],
    ratingOf: (n, word) => `${n} из 5 — ${word}`,
    yourReview: "Ваш отзыв",
    placeholder: "Как вам трафарет: качество, размер, как получился результат?",
    name: "Имя",
    city: "Город",
    optional: "(необязательно)",
    photos: "Фото результата",
    photosUpTo: (max) => `(до ${max}, необязательно)`,
    photosMax: (max) => `Можно добавить до ${max} фото`,
    processing: "Обрабатываем фото…",
    addMore: "Добавить ещё фото",
    addPhotos: "Добавить фото",
    yourPhoto: (n) => `Ваше фото ${n}`,
    removePhoto: (n) => `Убрать фото ${n}`,
    wait: "Подождите…",
    send: "Отправить отзыв",
    thanksPending: "Спасибо! Отзыв появится на сайте после проверки.",
    thanks: "Спасибо за отзыв!",
    allSent: "Отзывы на этот заказ уже отправлены",
    afterCheck: "Он появится на сайте после проверки. Нам очень важно знать, как вам наша работа.",
    messages: {
      "Оберіть товар для відгуку": "Выберите товар для отзыва",
      "Вкажіть імʼя (від 2 до 60 символів)": "Укажите имя (от 2 до 60 символов)",
      "Назва міста до 60 символів": "Название города до 60 символов",
      "Поставте оцінку від 1 до 5 зірок": "Поставьте оценку от 1 до 5 звёзд",
      "Напишіть хоча б кілька слів (від 10 символів)": "Напишите хотя бы несколько слов (от 10 символов)",
      "Відгук до 2000 символів": "Отзыв до 2000 символов",
      "До 5 фото": "До 5 фото",
      "Фото пошкоджене або завелике, додайте інше": "Фото повреждено или слишком большое, добавьте другое",
      "Оберіть фото у форматі JPG або PNG": "Выберите фото в формате JPG или PNG",
      "Не вдалося відкрити фото. Оберіть JPG або PNG": "Не удалось открыть фото. Выберите JPG или PNG",
      "Браузер не зміг обробити фото": "Браузер не смог обработать фото",
      "Фото завелике, оберіть інше": "Фото слишком большое, выберите другое",
      "Немає звʼязку з сервером. Перевірте інтернет і спробуйте ще раз.": "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.",
      "Забагато спроб. Спробуйте трохи пізніше.": "Слишком много попыток. Попробуйте чуть позже.",
      "Не вдалося надіслати відгук. Спробуйте ще раз.": "Не удалось отправить отзыв. Попробуйте ещё раз.",
      "Посилання недійсне. Напишіть нам, і ми надішлемо нове.": "Ссылка недействительна. Напишите нам, и мы пришлём новую.",
      "Перевірте відгук": "Проверьте отзыв",
      "Цього товару немає в замовленні": "Этого товара нет в заказе",
      "Оберіть товар із замовлення": "Выберите товар из заказа",
      "Відгук на цей товар уже надіслано. Дякуємо!": "Отзыв на этот товар уже отправлен. Спасибо!",
    },
  },  en: {
    title: "Review your order",
    lead: "Tell us how you liked our work. A photo of the result is best: it helps other customers choose.",
    badLinkStart: "This link is invalid or has expired. Message us on the ",
    contacts: "Contacts",
    badLinkEnd: " page and we will send you a new one.",
    order: (number) => `Order ${number}`,
    subject: "What are you reviewing",
    wholeOrder: (title) => `The whole order: ${title}`,
    reviewed: "Review sent",
    rating: "Rating",
    ratingWords: ["Poor", "So-so", "Okay", "Good", "Excellent"],
    ratingOf: (n, word) => `${n} out of 5 — ${word}`,
    yourReview: "Your review",
    placeholder: "How was the stencil: quality, size, how did the result turn out?",
    name: "Name",
    city: "City",
    optional: "(optional)",
    photos: "Photos of the result",
    photosUpTo: (max) => `(up to ${max}, optional)`,
    photosMax: (max) => `You can add up to ${max} photos`,
    processing: "Processing photos…",
    addMore: "Add more photos",
    addPhotos: "Add photos",
    yourPhoto: (n) => `Your photo ${n}`,
    removePhoto: (n) => `Remove photo ${n}`,
    wait: "Please wait…",
    send: "Send review",
    thanksPending: "Thank you! Your review will appear on the site after we check it.",
    thanks: "Thank you for your review!",
    allSent: "Reviews for this order have already been sent",
    afterCheck: "It will appear on the site after we check it. It means a lot to us to know how you liked our work.",
    messages: {
      "Оберіть товар для відгуку": "Choose a product to review",
      "Вкажіть імʼя (від 2 до 60 символів)": "Enter your name (2 to 60 characters)",
      "Назва міста до 60 символів": "City name up to 60 characters",
      "Поставте оцінку від 1 до 5 зірок": "Give a rating from 1 to 5 stars",
      "Напишіть хоча б кілька слів (від 10 символів)": "Write at least a few words (10 characters or more)",
      "Відгук до 2000 символів": "Review up to 2000 characters",
      "До 5 фото": "Up to 5 photos",
      "Фото пошкоджене або завелике, додайте інше": "The photo is damaged or too large, please add another one",
      "Оберіть фото у форматі JPG або PNG": "Choose a photo in JPG or PNG format",
      "Не вдалося відкрити фото. Оберіть JPG або PNG": "Could not open the photo. Choose a JPG or PNG",
      "Браузер не зміг обробити фото": "Your browser could not process the photo",
      "Фото завелике, оберіть інше": "The photo is too large, choose another one",
      "Немає звʼязку з сервером. Перевірте інтернет і спробуйте ще раз.": "No connection to the server. Check your internet and try again.",
      "Забагато спроб. Спробуйте трохи пізніше.": "Too many attempts. Please try a bit later.",
      "Не вдалося надіслати відгук. Спробуйте ще раз.": "Could not send the review. Please try again.",
      "Посилання недійсне. Напишіть нам, і ми надішлемо нове.": "This link is invalid. Message us and we will send you a new one.",
      "Перевірте відгук": "Please check your review",
      "Цього товару немає в замовленні": "This product is not in the order",
      "Оберіть товар із замовлення": "Choose a product from the order",
      "Відгук на цей товар уже надіслано. Дякуємо!": "A review for this product has already been sent. Thank you!",
    },
  },
};
