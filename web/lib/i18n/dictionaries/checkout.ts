// Texts of the checkout: the form, its fields (city, branch, invoice requisites), the field
// checks, the order summary, the answers after the order and the thank-you page.

import type { Dictionary } from "../../../types/i18n";
import type { CheckoutFieldKey } from "../../validation/checkout-form";

export interface CheckoutTexts {
  metaTitle: string;
  thanksMetaTitle: string;
  title: string;
  lead: string;
  loading: string;
  contacts: string;
  phone: string;
  name: string;
  namePlaceholder: string;
  delivery: string;
  deliveryOptions: { np_branch: string; np_courier: string; ukrposhta: string };
  npBranchOnly: string;
  byTariff: string;
  byCarrierTariff: string;
  arrives: (date: string) => string;
  courierAddress: string;
  ukrposhtaBranch: string;
  ukrposhtaPlaceholder: string;
  payment: string;
  paymentOptions: { card: [string, string]; cod: [string, string]; invoice: [string, string] };
  comment: string;
  commentLabel: string;
  noCall: string;
  approvalTitle: string;
  approvalLead: string;
  layoutOf: (title: string) => string;
  yourFile: string;
  noPicture: string;
  managerChecksFile: string;
  approvalCheck: string;
  approvalMissing: string;
  approvalHint: string;
  sending: string;
  confirm: (total: string) => string;
  agreeBefore: string;
  offer: string;
  agreeAnd: string;
  privacy: string;
  agreeAfter: string;
  yourOrder: string;
  pieces: string;
  parcel: string;
  toPay: string;
  deliveryPaidOnReceipt: string;
  errors: Record<CheckoutFieldKey, string> & { courierAddress: string };
  serverSizeMismatch: string;
  serverApproval: string;
  serverRateLimited: string;
  serverFailed: string;
  serverOffline: string;
  payFailedTitle: string;
  payFailedText: (number: string) => string;
  payFailedHint: string;
  payOpening: string;
  payRetry: string;
  writeViber: string;
  thanks: string;
  thanksOrder: (number: string) => string;
  orderSum: string;
  codNote: string;
  ttnNote: string;
  customNote: string;
  openInvoice: string;
  toHome: string;
  emptyTitle: string;
  emptyText: string;
  toCatalog: string;
  ownText: string;
  paymentReceived: string;
  cardFailed: string;
  orderSaved: string;
  city: string;
  cityPlaceholder: string;
  branchOrLocker: string;
  branch: string;
  locker: string;
  branchPlaceholder: string;
  tooBigTypeBranch: string;
  tooBigNoLockers: string;
  wontFit: string;
  requisites: string;
  taxCode: string;
  companyName: string;
  legalAddress: string;
  invoiceEmail: string;
  searching: string;
  fill: string;
  codeInvalid: string;
  noVat: string;
  notFound: string;
  fillManually: string;
  cartLabel: (count: number) => string;
  parcelTube: (length: string, diameter: string, weight: string) => string;
  parcelBox: (length: string, width: string, height: string, weight: string) => string;
  kg: (value: string) => string;
  volumetricKg: (value: string) => string;
}

export const CHECKOUT: Dictionary<CheckoutTexts> = {
  uk: {
    metaTitle: "Оформлення замовлення",
    thanksMetaTitle: "Дякуємо за замовлення",
    title: "Оформлення замовлення",
    lead: "Чотири поля, без реєстрації.",
    loading: "Завантаження кошика…",
    contacts: "Контакти",
    phone: "Телефон",
    name: "Імʼя та прізвище",
    namePlaceholder: "Як у паспорті для Нової пошти",
    delivery: "Доставка",
    deliveryOptions: { np_branch: "Нова пошта: відділення або поштомат", np_courier: "Нова пошта: курʼєр", ukrposhta: "Укрпошта" },
    npBranchOnly: "Нова пошта: відділення",
    byTariff: "за тарифом",
    byCarrierTariff: "за тарифом перевізника",
    arrives: (date) => `прибуде ${date}`,
    courierAddress: "Адреса: вулиця, будинок, квартира",
    ukrposhtaBranch: "Відділення Укрпошти або індекс",
    ukrposhtaPlaceholder: "Номер відділення або індекс",
    payment: "Оплата",
    paymentOptions: { card: ["Карткою онлайн, Apple Pay, Google Pay", "WayForPay"], cod: ["Накладений платіж при отриманні", ""], invoice: ["За рахунком для ФОП і ТОВ", "без ПДВ"] },
    comment: "Коментар або інший отримувач",
    commentLabel: "Коментар до замовлення або дані іншого отримувача",
    noCall: "Не передзвонюйте, все вірно",
    approvalTitle: "Погодження макета",
    approvalLead: "Ріжемо саме так, як на картинці. Перевірте текст, шрифт, розмір і матеріал.",
    layoutOf: (title) => `Макет: ${title}`,
    yourFile: "Ваш файл",
    noPicture: "Без картинки",
    managerChecksFile: "менеджер перевірить файл і надішле превʼю",
    approvalCheck: "Макет перевірив: текст, шрифт, розмір і матеріал правильні",
    approvalMissing: "Перевірте макет і поставте галочку «Макет перевірив»",
    approvalHint: "Кнопка стане активною, коли ви перевірите макет і поставите галочку «Макет перевірив».",
    sending: "Оформлюємо…",
    confirm: (total) => `Підтвердити замовлення · ${total}`,
    agreeBefore: "Натискаючи кнопку, ви погоджуєтесь з",
    offer: "публічною офертою",
    agreeAnd: "і",
    privacy: "політикою конфіденційності",
    agreeAfter: "Чек надійде від Вчасно.Каси.",
    yourOrder: "Ваше замовлення",
    pieces: "шт.",
    parcel: "Посилка",
    toPay: "До сплати",
    deliveryPaidOnReceipt: "Доставку оплачуєте перевізнику при отриманні.",
    errors: {
      phone: "Введіть номер у форматі +380 XX XXX XX XX",
      name: "Вкажіть імʼя і прізвище, як у паспорті для Нової пошти",
      city: "Вкажіть місто",
      wh: "Вкажіть відділення або поштомат",
      courierAddress: "Вкажіть адресу доставки",
      code: "Вкажіть код ЄДРПОУ або РНОКПП і назву для рахунку",
    },
    serverSizeMismatch: "Розмір виробу в кошику не збігається з макетом. Відкрийте конструктор, додайте напис у кошик ще раз і оформіть замовлення.",
    serverApproval: "Перевірте макет і поставте галочку «Макет перевірив».",
    serverRateLimited: "Забагато спроб оформлення. Зачекайте кілька хвилин або напишіть нам у Viber.",
    serverFailed: "Не вдалося оформити замовлення. Перевірте дані або напишіть нам у Viber.",
    serverOffline: "Немає звʼязку з магазином. Спробуйте ще раз за хвилину.",
    payFailedTitle: "Оплата не запустилася",
    payFailedText: (number) => `Замовлення ${number} збережено, але платіжна сторінка не відкрилася. Гроші не списано.`,
    payFailedHint: "Спробуйте ще раз або напишіть нам у Viber, і ми надішлемо посилання на оплату чи переведемо замовлення на оплату при отриманні.",
    payOpening: "Відкриваємо оплату…",
    payRetry: "Спробувати оплатити ще раз",
    writeViber: "Написати у Viber",
    thanks: "Дякуємо!",
    thanksOrder: (number) => `Дякуємо! Замовлення ${number}`,
    orderSum: "Сума замовлення:",
    codNote: ", оплата при отриманні",
    ttnNote: "Номер ТТН надішлемо у Viber або Telegram.",
    customNote: "Для індивідуальних виробів спершу надішлемо превʼю макета на погодження.",
    openInvoice: "Відкрити рахунок на оплату (можна зберегти в PDF)",
    toHome: "На головну",
    emptyTitle: "У кошику порожньо",
    emptyText: "Оберіть трафарет у каталозі або зробіть свій напис.",
    toCatalog: "До каталогу",
    ownText: "Свій напис",
    paymentReceived: "Оплату отримано.",
    cardFailed: "Оплата карткою не пройшла. ",
    orderSaved: "Замовлення збережене: ми звʼяжемося з вами і допоможемо оплатити іншим способом.",
    city: "Місто",
    cityPlaceholder: "Почніть вводити: Київ",
    branchOrLocker: "Відділення або поштомат",
    branch: "Відділення",
    locker: "Поштомат",
    branchPlaceholder: "Номер або вулиця",
    tooBigTypeBranch: "Посилка більша за комірку поштомата (40 × 60 × 30 см), тому оберіть відділення.",
    tooBigNoLockers: "Посилка більша за комірку поштомата (40 × 60 × 30 см), тому поштомати не пропонуємо.",
    wontFit: " (посилка не поміститься)",
    requisites: "Реквізити для рахунку",
    taxCode: "ЄДРПОУ або РНОКПП",
    companyName: "Назва (ФОП або компанія)",
    legalAddress: "Юридична адреса",
    invoiceEmail: "Email для рахунку",
    searching: "Шукаємо…",
    fill: "Заповнити",
    codeInvalid: "Код не проходить перевірку: ЄДРПОУ має 8 цифр, РНОКПП 10 цифр.",
    noVat: "Ми не платники ПДВ: рахунок буде без ПДВ.",
    notFound: "У реєстрі не знайшли, заповніть назву вручну.",
    fillManually: "Заповніть назву і адресу вручну.",
    cartLabel: (count) => `Кошик, товарів: ${count}`,
    parcelTube: (length, diameter, weight) => `Тубус ${length} см, Ø ${diameter} см, ${weight}`,
    parcelBox: (length, width, height, weight) => `Коробка ${length} × ${width} × ${height} см, ${weight}`,
    kg: (value) => `${value} кг`,
    volumetricKg: (value) => `${value} кг обʼємної ваги`,
  },
  ru: {
    metaTitle: "Оформление заказа",
    thanksMetaTitle: "Спасибо за заказ",
    title: "Оформление заказа",
    lead: "Четыре поля, без регистрации.",
    loading: "Загрузка корзины…",
    contacts: "Контакты",
    phone: "Телефон",
    name: "Имя и фамилия",
    namePlaceholder: "Как в паспорте для Новой почты",
    delivery: "Доставка",
    deliveryOptions: { np_branch: "Новая почта: отделение или почтомат", np_courier: "Новая почта: курьер", ukrposhta: "Укрпочта" },
    npBranchOnly: "Новая почта: отделение",
    byTariff: "по тарифу",
    byCarrierTariff: "по тарифу перевозчика",
    arrives: (date) => `прибудет ${date}`,
    courierAddress: "Адрес: улица, дом, квартира",
    ukrposhtaBranch: "Отделение Укрпочты или индекс",
    ukrposhtaPlaceholder: "Номер отделения или индекс",
    payment: "Оплата",
    paymentOptions: { card: ["Картой онлайн, Apple Pay, Google Pay", "WayForPay"], cod: ["Наложенный платёж при получении", ""], invoice: ["По счёту для ФЛП и ООО", "без НДС"] },
    comment: "Комментарий или другой получатель",
    commentLabel: "Комментарий к заказу или данные другого получателя",
    noCall: "Не перезванивайте, всё верно",
    approvalTitle: "Согласование макета",
    approvalLead: "Режем именно так, как на картинке. Проверьте текст, шрифт, размер и материал.",
    layoutOf: (title) => `Макет: ${title}`,
    yourFile: "Ваш файл",
    noPicture: "Без картинки",
    managerChecksFile: "менеджер проверит файл и пришлёт превью",
    approvalCheck: "Макет проверил: текст, шрифт, размер и материал правильные",
    approvalMissing: "Проверьте макет и поставьте галочку «Макет проверил»",
    approvalHint: "Кнопка станет активной, когда вы проверите макет и поставите галочку «Макет проверил».",
    sending: "Оформляем…",
    confirm: (total) => `Подтвердить заказ · ${total}`,
    agreeBefore: "Нажимая кнопку, вы соглашаетесь с",
    offer: "публичной офертой",
    agreeAnd: "и",
    privacy: "политикой конфиденциальности",
    agreeAfter: "Чек придёт от Вчасно.Каса.",
    yourOrder: "Ваш заказ",
    pieces: "шт.",
    parcel: "Посылка",
    toPay: "К оплате",
    deliveryPaidOnReceipt: "Доставку оплачиваете перевозчику при получении.",
    errors: {
      phone: "Введите номер в формате +380 XX XXX XX XX",
      name: "Укажите имя и фамилию, как в паспорте для Новой почты",
      city: "Укажите город",
      wh: "Укажите отделение или почтомат",
      courierAddress: "Укажите адрес доставки",
      code: "Укажите код ЕГРПОУ или РНУКПН и название для счёта",
    },
    serverSizeMismatch: "Размер изделия в корзине не совпадает с макетом. Откройте конструктор, добавьте надпись в корзину ещё раз и оформите заказ.",
    serverApproval: "Проверьте макет и поставьте галочку «Макет проверил».",
    serverRateLimited: "Слишком много попыток оформления. Подождите несколько минут или напишите нам в Viber.",
    serverFailed: "Не удалось оформить заказ. Проверьте данные или напишите нам в Viber.",
    serverOffline: "Нет связи с магазином. Попробуйте ещё раз через минуту.",
    payFailedTitle: "Оплата не запустилась",
    payFailedText: (number) => `Заказ ${number} сохранён, но платёжная страница не открылась. Деньги не списаны.`,
    payFailedHint: "Попробуйте ещё раз или напишите нам в Viber, и мы пришлём ссылку на оплату или переведём заказ на оплату при получении.",
    payOpening: "Открываем оплату…",
    payRetry: "Попробовать оплатить ещё раз",
    writeViber: "Написать в Viber",
    thanks: "Спасибо!",
    thanksOrder: (number) => `Спасибо! Заказ ${number}`,
    orderSum: "Сумма заказа:",
    codNote: ", оплата при получении",
    ttnNote: "Номер ТТН пришлём в Viber или Telegram.",
    customNote: "Для индивидуальных изделий сначала пришлём превью макета на согласование.",
    openInvoice: "Открыть счёт на оплату (можно сохранить в PDF)",
    toHome: "На главную",
    emptyTitle: "В корзине пусто",
    emptyText: "Выберите трафарет в каталоге или сделайте свою надпись.",
    toCatalog: "В каталог",
    ownText: "Своя надпись",
    paymentReceived: "Оплата получена.",
    cardFailed: "Оплата картой не прошла. ",
    orderSaved: "Заказ сохранён: мы свяжемся с вами и поможем оплатить другим способом.",
    city: "Город",
    cityPlaceholder: "Начните вводить: Киев",
    branchOrLocker: "Отделение или почтомат",
    branch: "Отделение",
    locker: "Почтомат",
    branchPlaceholder: "Номер или улица",
    tooBigTypeBranch: "Посылка больше ячейки почтомата (40 × 60 × 30 см), поэтому выберите отделение.",
    tooBigNoLockers: "Посылка больше ячейки почтомата (40 × 60 × 30 см), поэтому почтоматы не предлагаем.",
    wontFit: " (посылка не поместится)",
    requisites: "Реквизиты для счёта",
    taxCode: "ЕГРПОУ или РНУКПН",
    companyName: "Название (ФЛП или компания)",
    legalAddress: "Юридический адрес",
    invoiceEmail: "Email для счёта",
    searching: "Ищем…",
    fill: "Заполнить",
    codeInvalid: "Код не проходит проверку: ЕГРПОУ имеет 8 цифр, РНУКПН 10 цифр.",
    noVat: "Мы не плательщики НДС: счёт будет без НДС.",
    notFound: "В реестре не нашли, заполните название вручную.",
    fillManually: "Заполните название и адрес вручную.",
    cartLabel: (count) => `Корзина, товаров: ${count}`,
    parcelTube: (length, diameter, weight) => `Тубус ${length} см, Ø ${diameter} см, ${weight}`,
    parcelBox: (length, width, height, weight) => `Коробка ${length} × ${width} × ${height} см, ${weight}`,
    kg: (value) => `${value} кг`,
    volumetricKg: (value) => `${value} кг объёмного веса`,
  },
  en: {
    metaTitle: "Checkout",
    thanksMetaTitle: "Thank you for your order",
    title: "Checkout",
    lead: "Four fields, no sign-up.",
    loading: "Loading your cart…",
    contacts: "Contact details",
    phone: "Phone",
    name: "First and last name",
    namePlaceholder: "As in your ID, for Nova Poshta",
    delivery: "Delivery",
    deliveryOptions: { np_branch: "Nova Poshta: branch or parcel locker", np_courier: "Nova Poshta: courier", ukrposhta: "Ukrposhta" },
    npBranchOnly: "Nova Poshta: branch",
    byTariff: "carrier rates",
    byCarrierTariff: "at carrier rates",
    arrives: (date) => `arrives ${date}`,
    courierAddress: "Address: street, building, apartment",
    ukrposhtaBranch: "Ukrposhta branch or postal code",
    ukrposhtaPlaceholder: "Branch number or postal code",
    payment: "Payment",
    paymentOptions: { card: ["Card online, Apple Pay, Google Pay", "WayForPay"], cod: ["Cash on delivery", ""], invoice: ["Invoice for sole proprietors and companies", "no VAT"] },
    comment: "Comment or another recipient",
    commentLabel: "Order comment or details of another recipient",
    noCall: "No need to call me, everything is correct",
    approvalTitle: "Layout approval",
    approvalLead: "We cut exactly what you see in the picture. Check the text, font, size and material.",
    layoutOf: (title) => `Layout: ${title}`,
    yourFile: "Your file",
    noPicture: "No picture",
    managerChecksFile: "our manager will check the file and send a preview",
    approvalCheck: "I've checked the layout: text, font, size and material are correct",
    approvalMissing: "Check the layout and tick “I've checked the layout”",
    approvalHint: "The button becomes active once you check the layout and tick “I've checked the layout”.",
    sending: "Placing your order…",
    confirm: (total) => `Confirm order · ${total}`,
    agreeBefore: "By clicking the button, you agree to the",
    offer: "public offer",
    agreeAnd: "and",
    privacy: "privacy policy",
    agreeAfter: "Your receipt will come from Vchasno.Kasa.",
    yourOrder: "Your order",
    pieces: "pcs",
    parcel: "Parcel",
    toPay: "Total",
    deliveryPaidOnReceipt: "You pay the carrier for delivery when you pick up the parcel.",
    errors: {
      phone: "Enter the number as +380 XX XXX XX XX",
      name: "Enter your first and last name as in your ID, for Nova Poshta",
      city: "Enter your city",
      wh: "Choose a branch or parcel locker",
      courierAddress: "Enter the delivery address",
      code: "Enter the EDRPOU or RNOKPP code and a name for the invoice",
    },
    serverSizeMismatch: "The item size in your cart doesn't match the layout. Open the designer, add the item to the cart again and check out.",
    serverApproval: "Check the layout and tick “I've checked the layout”.",
    serverRateLimited: "Too many checkout attempts. Wait a few minutes or message us on Viber.",
    serverFailed: "We couldn't place the order. Check your details or message us on Viber.",
    serverOffline: "Can't reach the shop. Try again in a minute.",
    payFailedTitle: "Payment didn't start",
    payFailedText: (number) => `Order ${number} is saved, but the payment page didn't open. You haven't been charged.`,
    payFailedHint: "Try again or message us on Viber: we'll send you a payment link or switch the order to cash on delivery.",
    payOpening: "Opening payment…",
    payRetry: "Try paying again",
    writeViber: "Message us on Viber",
    thanks: "Thank you!",
    thanksOrder: (number) => `Thank you! Order ${number}`,
    orderSum: "Order total:",
    codNote: ", cash on delivery",
    ttnNote: "We'll send the tracking number via Viber or Telegram.",
    customNote: "For custom items, we'll first send you a layout preview to approve.",
    openInvoice: "Open the invoice (you can save it as PDF)",
    toHome: "Back to home",
    emptyTitle: "Your cart is empty",
    emptyText: "Pick a stencil in the catalog or create your own text.",
    toCatalog: "Go to catalog",
    ownText: "Your own text",
    paymentReceived: "Payment received.",
    cardFailed: "The card payment didn't go through. ",
    orderSaved: "Your order is saved: we'll contact you and help you pay another way.",
    city: "City",
    cityPlaceholder: "Start typing: Kyiv",
    branchOrLocker: "Branch or parcel locker",
    branch: "Branch",
    locker: "Parcel locker",
    branchPlaceholder: "Number or street",
    tooBigTypeBranch: "The parcel is larger than a locker cell (40 × 60 × 30 cm), so please choose a branch.",
    tooBigNoLockers: "The parcel is larger than a locker cell (40 × 60 × 30 cm), so parcel lockers aren't offered.",
    wontFit: " (parcel won't fit)",
    requisites: "Invoice details",
    taxCode: "EDRPOU or RNOKPP",
    companyName: "Name (sole proprietor or company)",
    legalAddress: "Registered address",
    invoiceEmail: "Email for the invoice",
    searching: "Searching…",
    fill: "Fill in",
    codeInvalid: "The code doesn't pass the check: EDRPOU has 8 digits, RNOKPP has 10.",
    noVat: "We are not VAT registered: the invoice will have no VAT.",
    notFound: "Not found in the registry, please enter the name manually.",
    fillManually: "Enter the name and address manually.",
    cartLabel: (count) => `Cart, items: ${count}`,
    parcelTube: (length, diameter, weight) => `Tube ${length} cm, Ø ${diameter} cm, ${weight}`,
    parcelBox: (length, width, height, weight) => `Box ${length} × ${width} × ${height} cm, ${weight}`,
    kg: (value) => `${value} kg`,
    volumetricKg: (value) => `${value} kg volumetric weight`,
  },
};
