// Texts of «Мій кабінет»: sign-in, «Мої замовлення», order cards and sign-in errors. The shop
// writes order statuses and repeat notes in Ukrainian; `serverTexts` gives them in this language.

import type { AccountSignInError } from "../../../types/account";
import type { Dictionary } from "../../../types/i18n";

export interface AccountTexts {
  metaTitle: string;
  telegramMetaTitle: string;
  loginTitle: string;
  loginLead: string;
  google: string;
  telegram: string;
  noPassword: string;
  soon: string;
  myOrders: string;
  yourCabinet: string;
  logout: string;
  noOrders: string;
  toCatalog: string;
  order: (number: string) => string;
  whereParcel: string;
  pieces: string;
  now: string;
  repeat: string;
  repeatOrder: (number: string) => string;
  telegramFailed: string;
  telegramSigningIn: string;
  signInErrors: Record<AccountSignInError, string>;
  serverTexts: Record<string, string>;
}

export const ACCOUNT: Dictionary<AccountTexts> = {
  uk: {
    metaTitle: "Мій кабінет",
    telegramMetaTitle: "Вхід через Telegram",
    loginTitle: "Вхід у кабінет",
    loginLead: "Ваші замовлення, їх статус і номер ТТН. Будь-яке замовлення можна повторити в один клік.",
    google: "Увійти через Google",
    telegram: "Увійти через Telegram",
    noPassword: "Без пароля і SMS. Замовити можна і без кабінету.",
    soon: "Вхід у кабінет скоро запрацює. Поки що статус замовлення підкажемо у Viber або Telegram.",
    myOrders: "Мої замовлення",
    yourCabinet: "Ваш кабінет",
    logout: "Вийти",
    noOrders: "Тут зʼявляться замовлення, які ви оформите, коли увійшли в кабінет.",
    toCatalog: "До каталогу",
    order: (number) => `Замовлення ${number}`,
    whereParcel: "Де посилка?",
    pieces: "шт.",
    now: "зараз",
    repeat: "Повторити замовлення",
    repeatOrder: (number) => `Повторити замовлення ${number}`,
    telegramFailed: "Немає звʼязку. Оновіть сторінку.",
    telegramSigningIn: "Входимо через Telegram…",
    signInErrors: {
      google: "Google не підтвердив вхід. Спробуйте ще раз.",
      telegram: "Telegram не підтвердив вхід. Спробуйте ще раз.",
      expired: "Сесія закінчилась. Увійдіть ще раз.",
      unavailable: "Вхід зараз не працює. Спробуйте трохи пізніше або напишіть нам.",
    },
    serverTexts: {},
  },
  ru: {
    metaTitle: "Мой кабинет",
    telegramMetaTitle: "Вход через Telegram",
    loginTitle: "Вход в кабинет",
    loginLead: "Ваши заказы, их статус и номер ТТН. Любой заказ можно повторить в один клик.",
    google: "Войти через Google",
    telegram: "Войти через Telegram",
    noPassword: "Без пароля и SMS. Заказать можно и без кабинета.",
    soon: "Вход в кабинет скоро заработает. Пока статус заказа подскажем в Viber или Telegram.",
    myOrders: "Мои заказы",
    yourCabinet: "Ваш кабинет",
    logout: "Выйти",
    noOrders: "Здесь появятся заказы, которые вы оформите, когда вошли в кабинет.",
    toCatalog: "В каталог",
    order: (number) => `Заказ ${number}`,
    whereParcel: "Где посылка?",
    pieces: "шт.",
    now: "сейчас",
    repeat: "Повторить заказ",
    repeatOrder: (number) => `Повторить заказ ${number}`,
    telegramFailed: "Нет связи. Обновите страницу.",
    telegramSigningIn: "Входим через Telegram…",
    signInErrors: {
      google: "Google не подтвердил вход. Попробуйте ещё раз.",
      telegram: "Telegram не подтвердил вход. Попробуйте ещё раз.",
      expired: "Сессия закончилась. Войдите ещё раз.",
      unavailable: "Вход сейчас не работает. Попробуйте чуть позже или напишите нам.",
    },
    serverTexts: {
      "Прийнято, виготовляємо": "Принят, изготавливаем",
      "Чекає на оплату": "Ждёт оплаты",
      "Чекає на оплату карткою": "Ждёт оплаты картой",
      "Чекає на оплату за рахунком": "Ждёт оплаты по счёту",
      "Оплачено, виготовляємо": "Оплачен, изготавливаем",
      "Відправлено": "Отправлен",
      "Скасовано": "Отменён",
      "Цей товар можна замовити знову через менеджера": "Этот товар можно заказать снова через менеджера",
      "Цього товару вже немає в продажу": "Этого товара уже нет в продаже",
      "Зберіть виріб заново в конструкторі: його вже не можна повторити автоматично": "Соберите изделие заново в конструкторе: его уже нельзя повторить автоматически",
    },
  },
};
