// Texts of the «Свій напис» constructor, the free canvas, the font pickers and the parts every
// constructor shares (price panel, quantity, layout link). Material, colour and check texts come
// with the data (LocalizedText); everything the components write themselves is here.

import type { Dictionary } from "../../../types/i18n";

export interface ConstructorTexts {
  kicker: string;
  preview: string;
  // Price panel and quantity (every constructor).
  toCart: string;
  uploadingLogo: string;
  uploadingShort: string;
  added: string;
  addedShort: string;
  pcs: string;
  quantity: string;
  less: string;
  more: string;
  scalePieces: string;
  scaleSets: string;
  addForDiscount: (qty: number, pct: number) => string;
  fromQty: (qty: number) => string;
  onePiece: string;
  production: string;
  buy: string;
  calculating: string;
  // Layout link.
  draftLink: string;
  draftCopied: string;
  draftNote: string;
  // Fonts.
  fontsLoading: string;
  yourFont: (name: string) => string;
  sampleText: string;
  customFontSummary: string;
  customFontRights: string;
  customFontLimit: (max: number) => string;
  customFontChecking: string;
  customFontUpload: string;
  customFontNeedRights: string;
  cyrillic: string;
  latin: string;
  digits: string;
  ukrainianLetters: string;
  latinLetters: string;
  russianLetters: string;
  signs: string;
  missingGroup: (group: string, chars: string) => string;
  embeddingRestricted: string;
  noLetters: (chars: string) => string;
  remove: string;
  /** Errors of a font upload, written in Ukrainian by the font check; Ukrainian → this language. */
  fontErrors: Record<string, string>;
  // «Свій напис».
  title: string;
  canvasLink: string;
  canvasLinkText: string;
  whatWeMake: string;
  modes: Record<"stencil" | "weld", { title: string; hint: string }>;
  templates: string[];
  defaultText: string;
  text: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  upper: string;
  font: string;
  perLineFonts: string;
  lineLabel: (n: number, line: string) => string;
  sameAsMain: (name: string) => string;
  size: string;
  byWidth: string;
  byLetter: string;
  square: string;
  squareNote: string;
  squareOtherMaterial: string;
  ownLogo: string;
  byYourLayout: string;
  widthCm: string;
  heightCm: string;
  capHeightMm: string;
  material: string;
  bridges: string;
  bridgeStrengths: Record<"thin" | "normal" | "strong", string>;
  bridgesNote: string;
  pieceWidth: string;
  materialColour: string;
  quantityTiers: string;
  enlargeTo: (cm: number) => string;
  checkNote: string;
  views: Record<"stencil" | "wall" | "cake" | "piece", string>;
  fontLoadFailed: string;
  bridgesFailed: string;
  bridgesCalculating: string;
  fontsLoadingLong: string;
  weldApart: string;
  missingChars: (chars: string) => string;
  weldBusy: string;
  bridgesBusy: string;
  footerWeld: (w: string, h: string, cap: number) => string;
  footerStencil: (w: string, h: string, cap: number, bridges: number) => string;
  cartWeld: (text: string, font: string, material: string, colour: string) => string;
  cartStencil: (text: string, font: string) => string;
  stencilPreview: (w: number, h: number) => string;
  piecePreview: (w: number, h: number) => string;
  // Welded word options.
  joining: string;
  density: [string, string, string];
  baseline: string;
  outline: string;
  skewers: string;
  skewerCounts: [string, string, string];
  skewerLength: string;
  weldNote: string;
  // Free canvas.
  canvasTitle: string;
  canvasLead: string;
  canvasRegion: string;
  canvasLabel: (w: number, h: number) => string;
  canvasLoading: string;
  shapes: Record<"circle" | "rect" | "star" | "heart" | "frame", string>;
  shapeFallback: string;
  canvasModes: Record<"stencil" | "piece", { title: string; hint: string }>;
  autoJoin: string;
  addText: string;
  textLabel: string;
  add: string;
  addShape: string;
  sheet: string;
  gridMm: string;
  marginMm: string;
  snap: string;
  showGrid: string;
  copy: string;
  lock: string;
  unlock: string;
  delete: string;
  undo: string;
  redo: string;
  canvasFooter: (w: number, h: number, grid: number) => string;
  checking: string;
  bridgeCount: (n: number) => string;
  canvasDefaultText: string;
  canvasCheckFailed: string;
  canvasTextFailed: string;
  cartCanvasPiece: (names: string) => string;
  cartCanvasStencil: (names: string) => string;
}

export const CONSTRUCTOR: Dictionary<ConstructorTexts> = {
  uk: {
    kicker: "Конструктор",
    preview: "Попередній перегляд",
    toCart: "В кошик",
    uploadingLogo: "Завантажуємо логотип…",
    uploadingShort: "Завантажуємо…",
    added: "✓ Додано в кошик",
    addedShort: "✓ Додано",
    pcs: "шт.",
    quantity: "Кількість",
    less: "Менше",
    more: "Більше",
    scalePieces: "Від 10 шт −5%, від 50 шт −10%, від 100 шт −15%.",
    scaleSets: "Від 10 наборів −5%, від 50 −10%, від 100 −15%.",
    addForDiscount: (qty, pct) => ` Додайте ще ${qty} шт., щоб отримати −${pct}%.`,
    fromQty: (qty) => `від ${qty} шт.`,
    onePiece: "1 шт.",
    production: "виготовлення 3 робочі дні",
    buy: "Купити",
    calculating: "Розраховуємо…",
    draftLink: "Посилання на макет",
    draftCopied: "✓ Посилання скопійовано",
    draftNote: "Відкриє цей самий макет на телефоні чи іншому компʼютері. Ваші власні шрифти лишаються на цьому пристрої.",
    fontsLoading: "Шрифти завантажуються…",
    yourFont: (name) => `Ваш: ${name}`,
    sampleText: "Напис",
    customFontSummary: "Свій шрифт (TTF, OTF, WOFF, WOFF2)",
    customFontRights: "Підтверджую, що маю право використовувати цей шрифт для виготовлення виробу. Шрифт бачите лише ви, ми використаємо його тільки для вашого замовлення.",
    customFontLimit: (max) => `Можна додати до ${max} шрифтів. Приберіть зайвий, щоб додати новий.`,
    customFontChecking: "Перевіряємо шрифт…",
    customFontUpload: "Завантажити шрифт",
    customFontNeedRights: "Щоб завантажити, підтвердіть право на шрифт.",
    cyrillic: "Кирилиця",
    latin: "Латиниця",
    digits: "Цифри",
    ukrainianLetters: "Українські літери",
    latinLetters: "Латинські",
    russianLetters: "Російські",
    signs: "Знаки",
    missingGroup: (group, chars) => `Немає (${group}): ${chars}`,
    embeddingRestricted: "Автор шрифту заборонив його вбудовування; переконайтеся, що маєте право на виробництво.",
    noLetters: (chars) => ` · немає літер: ${chars}`,
    remove: "Прибрати",
    fontErrors: {},
    title: "Свій напис",
    canvasLink: "Кілька написів і фігур на одному аркуші?",
    canvasLinkText: "Вільне полотно",
    whatWeMake: "Що робимо",
    modes: {
      stencil: { title: "Трафарет", hint: "Вирізаний напис, щоб наносити фарбу, какао чи пудру" },
      weld: { title: "Цілим словом", hint: "Топпер або напис з акрилу однією деталлю" },
    },
    templates: ["Своє імʼя", "Кава", "Just Married\n10.10.2026", "Обережно", "Wi-Fi", "Підʼїзд 3"],
    defaultText: "КАВА І ДОБРІ\nЛЮДИ",
    text: "Текст",
    alignLeft: "Ліворуч",
    alignCenter: "По центру",
    alignRight: "Праворуч",
    upper: "ВЕЛИКІ ЛІТЕРИ",
    font: "Шрифт",
    perLineFonts: "Різні шрифти для рядків",
    lineLabel: (n, line) => `Рядок ${n}: «${line}»`,
    sameAsMain: (name) => `Як основний (${name})`,
    size: "Розмір",
    byWidth: "За шириною трафарету",
    byLetter: "За висотою літер",
    square: "Квадратний",
    squareNote: "Напис вписуємо в квадрат і ставимо по центру.",
    squareOtherMaterial: " Ціни квадратних розмірів для ПЕТ 0,5 мм, для цього матеріалу рахуємо за площею.",
    ownLogo: " Свій логотип:",
    byYourLayout: "за вашим макетом",
    widthCm: "Ширина, см",
    heightCm: "Висота, см",
    capHeightMm: "Висота великої літери, мм",
    material: "Матеріал",
    bridges: "Перемички",
    bridgeStrengths: { thin: "Тонкі", normal: "Звичайні", strong: "Міцні" },
    bridgesNote: "Міцні тримають краще при частому митті, тонкі менш помітні у малюнку.",
    pieceWidth: "Ширина виробу",
    materialColour: "Матеріал і колір",
    quantityTiers: "Кількість і опт",
    enlargeTo: (cm) => `Збільшити до ${cm} см`,
    checkNote: "Перевіримо макет і надішлемо превʼю у Viber або Telegram до порізки. Файл для різки готуємо самі.",
    views: { stencil: "Трафарет", wall: "На стіні", cake: "На торті", piece: "Виріб" },
    fontLoadFailed: "Не вдалося завантажити шрифти. Оновіть сторінку.",
    bridgesFailed: "Не вдалося розрахувати перемички. Змініть текст або оновіть сторінку.",
    bridgesCalculating: "Розраховуємо перемички…",
    fontsLoadingLong: "Завантаження шрифтів…",
    weldApart: "Не всі частини вдалося з’єднати. Збільште ширину або увімкніть планку під словом.",
    missingChars: (chars) => `Цього шрифту немає для символів: ${chars}`,
    weldBusy: "Зʼєднуємо літери, кнопка стане активною за кілька секунд.",
    bridgesBusy: "Розраховуємо перемички, кнопка стане активною за кілька секунд.",
    footerWeld: (w, h, cap) => `${w} × ${h} см · висота літер ≈ ${cap} мм`,
    footerStencil: (w, h, cap, bridges) => `${w} × ${h} см · висота літер ≈ ${cap} мм · перемичок ${bridges}`,
    cartWeld: (text, font, material, colour) => `Напис цілим словом «${text}», ${font}, ${material}, ${colour}`,
    cartStencil: (text, font) => `Свій напис «${text}», ${font}`,
    stencilPreview: (w, h) => `Превʼю трафарету ${w}×${h} см`,
    piecePreview: (w, h) => `Превʼю виробу ${w}×${h} см`,
    joining: "З’єднання літер",
    density: ["Легко торкаються", "Щільно", "Дуже щільно"],
    baseline: "Планка під словом",
    outline: "Обведення навколо",
    skewers: "Шпажки:",
    skewerCounts: ["без шпажок", "одна", "дві"],
    skewerLength: "Довжина шпажки, см",
    weldNote: "Крапки над «і», «ї», «й» і окремі слова з’єднуємо перемичками автоматично, виріб виходить однією деталлю.",
    canvasTitle: "Вільне полотно",
    canvasLead: "Розставте написи і фігури на одному трафареті. Перемички ставимо самі, проблемні місця підсвічуємо.",
    canvasRegion: "Полотно",
    canvasLabel: (w, h) => `Полотно трафарету ${w}×${h} см`,
    canvasLoading: "Завантаження полотна…",
    shapes: { circle: "Коло", rect: "Прямокутник", star: "Зірка", heart: "Серце", frame: "Рамка" },
    shapeFallback: "фігура",
    canvasModes: {
      stencil: { title: "Трафарет", hint: "Елементи вирізаються з аркуша, перемички ставимо самі" },
      piece: { title: "Цілим шматком", hint: "Елементи стають однією деталлю з акрилу: топпер, напис, вивіска" },
    },
    autoJoin: "Зʼєднати автоматично: короткі прямі перемички між частинами",
    addText: "Додати напис",
    textLabel: "Текст напису",
    add: "Додати",
    addShape: "Додати фігуру",
    sheet: "Аркуш",
    gridMm: "Сітка, мм",
    marginMm: "Відступ від краю, мм",
    snap: "Прилипати до сітки",
    showGrid: "Показувати сітку",
    copy: "Копія",
    lock: "Закріпити",
    unlock: "Розблокувати",
    delete: "Видалити",
    undo: "↶ Скасувати",
    redo: "↷ Повторити",
    canvasFooter: (w, h, grid) => `${w} × ${h} см · сітка ${grid} мм · `,
    checking: "перевіряємо…",
    bridgeCount: (n) => `перемичок ${n}`,
    canvasDefaultText: "Кава",
    canvasCheckFailed: "Не вдалося перевірити макет. Оновіть сторінку.",
    canvasTextFailed: "Не вдалося підготувати текст цим шрифтом. Оберіть інший шрифт.",
    cartCanvasPiece: (names) => `Виріб цілим шматком з полотна: ${names}`,
    cartCanvasStencil: (names) => `Трафарет з полотна: ${names}`,
  },
  ru: {
    kicker: "Конструктор",
    preview: "Предпросмотр",
    toCart: "В корзину",
    uploadingLogo: "Загружаем логотип…",
    uploadingShort: "Загружаем…",
    added: "✓ Добавлено в корзину",
    addedShort: "✓ Добавлено",
    pcs: "шт.",
    quantity: "Количество",
    less: "Меньше",
    more: "Больше",
    scalePieces: "От 10 шт −5%, от 50 шт −10%, от 100 шт −15%.",
    scaleSets: "От 10 наборов −5%, от 50 −10%, от 100 −15%.",
    addForDiscount: (qty, pct) => ` Добавьте ещё ${qty} шт., чтобы получить −${pct}%.`,
    fromQty: (qty) => `от ${qty} шт.`,
    onePiece: "1 шт.",
    production: "изготовление 3 рабочих дня",
    buy: "Купить",
    calculating: "Рассчитываем…",
    draftLink: "Ссылка на макет",
    draftCopied: "✓ Ссылка скопирована",
    draftNote: "Откроет этот же макет на телефоне или другом компьютере. Ваши собственные шрифты остаются на этом устройстве.",
    fontsLoading: "Шрифты загружаются…",
    yourFont: (name) => `Ваш: ${name}`,
    sampleText: "Надпись",
    customFontSummary: "Свой шрифт (TTF, OTF, WOFF, WOFF2)",
    customFontRights: "Подтверждаю, что имею право использовать этот шрифт для изготовления изделия. Шрифт видите только вы, мы используем его только для вашего заказа.",
    customFontLimit: (max) => `Можно добавить до ${max} шрифтов. Уберите лишний, чтобы добавить новый.`,
    customFontChecking: "Проверяем шрифт…",
    customFontUpload: "Загрузить шрифт",
    customFontNeedRights: "Чтобы загрузить, подтвердите право на шрифт.",
    cyrillic: "Кириллица",
    latin: "Латиница",
    digits: "Цифры",
    ukrainianLetters: "Украинские буквы",
    latinLetters: "Латинские",
    russianLetters: "Русские",
    signs: "Знаки",
    missingGroup: (group, chars) => `Нет (${group}): ${chars}`,
    embeddingRestricted: "Автор шрифта запретил его встраивание; убедитесь, что у вас есть право на производство.",
    noLetters: (chars) => ` · нет букв: ${chars}`,
    remove: "Убрать",
    fontErrors: {
      "Немає звʼязку з магазином. Спробуйте ще раз за хвилину.": "Нет связи с магазином. Попробуйте ещё раз через минуту.",
      "Забагато шрифтів за годину. Спробуйте пізніше.": "Слишком много шрифтов за час. Попробуйте позже.",
      "Не вдалося завантажити шрифт": "Не удалось загрузить шрифт",
      "Підтвердьте, що маєте право використовувати цей шрифт": "Подтвердите, что имеете право использовать этот шрифт",
      "Файл шрифту більший за 10 МБ": "Файл шрифта больше 10 МБ",
      "Шрифт не підходить": "Шрифт не подходит",
      "Не вдалося відкрити шрифт WOFF2. Спробуйте той самий шрифт у TTF або OTF": "Не удалось открыть шрифт WOFF2. Попробуйте этот же шрифт в TTF или OTF",
      "Файл порожній": "Файл пустой",
      "Файл WOFF2 потрібно спершу розпакувати": "Файл WOFF2 нужно сначала распаковать",
      "Це не файл шрифту. Підходять TTF, OTF, WOFF або WOFF2": "Это не файл шрифта. Подходят TTF, OTF, WOFF или WOFF2",
      "Файл шрифту пошкоджений або не читається": "Файл шрифта повреждён или не читается",
      "У шрифті немає ні українських, ні латинських літер": "В шрифте нет ни украинских, ни латинских букв",
      "Літери в шрифті не мають контурів": "Буквы в шрифте не имеют контуров",
    },
    title: "Своя надпись",
    canvasLink: "Несколько надписей и фигур на одном листе?",
    canvasLinkText: "Свободное полотно",
    whatWeMake: "Что делаем",
    modes: {
      stencil: { title: "Трафарет", hint: "Вырезанная надпись, чтобы наносить краску, какао или пудру" },
      weld: { title: "Целым словом", hint: "Топпер или надпись из акрила одной деталью" },
    },
    templates: ["Своё имя", "Кофе", "Just Married\n10.10.2026", "Осторожно", "Wi-Fi", "Подъезд 3"],
    defaultText: "КОФЕ И ДОБРЫЕ\nЛЮДИ",
    text: "Текст",
    alignLeft: "Слева",
    alignCenter: "По центру",
    alignRight: "Справа",
    upper: "ЗАГЛАВНЫЕ БУКВЫ",
    font: "Шрифт",
    perLineFonts: "Разные шрифты для строк",
    lineLabel: (n, line) => `Строка ${n}: «${line}»`,
    sameAsMain: (name) => `Как основной (${name})`,
    size: "Размер",
    byWidth: "По ширине трафарета",
    byLetter: "По высоте букв",
    square: "Квадратный",
    squareNote: "Надпись вписываем в квадрат и ставим по центру.",
    squareOtherMaterial: " Цены квадратных размеров для ПЭТ 0,5 мм, для этого материала считаем по площади.",
    ownLogo: " Свой логотип:",
    byYourLayout: "по вашему макету",
    widthCm: "Ширина, см",
    heightCm: "Высота, см",
    capHeightMm: "Высота заглавной буквы, мм",
    material: "Материал",
    bridges: "Перемычки",
    bridgeStrengths: { thin: "Тонкие", normal: "Обычные", strong: "Прочные" },
    bridgesNote: "Прочные держат лучше при частом мытье, тонкие менее заметны в рисунке.",
    pieceWidth: "Ширина изделия",
    materialColour: "Материал и цвет",
    quantityTiers: "Количество и опт",
    enlargeTo: (cm) => `Увеличить до ${cm} см`,
    checkNote: "Проверим макет и пришлём превью в Viber или Telegram до порезки. Файл для резки готовим сами.",
    views: { stencil: "Трафарет", wall: "На стене", cake: "На торте", piece: "Изделие" },
    fontLoadFailed: "Не удалось загрузить шрифты. Обновите страницу.",
    bridgesFailed: "Не удалось рассчитать перемычки. Измените текст или обновите страницу.",
    bridgesCalculating: "Рассчитываем перемычки…",
    fontsLoadingLong: "Загрузка шрифтов…",
    weldApart: "Не все части удалось соединить. Увеличьте ширину или включите планку под словом.",
    missingChars: (chars) => `В этом шрифте нет символов: ${chars}`,
    weldBusy: "Соединяем буквы, кнопка станет активной через несколько секунд.",
    bridgesBusy: "Рассчитываем перемычки, кнопка станет активной через несколько секунд.",
    footerWeld: (w, h, cap) => `${w} × ${h} см · высота букв ≈ ${cap} мм`,
    footerStencil: (w, h, cap, bridges) => `${w} × ${h} см · высота букв ≈ ${cap} мм · перемычек ${bridges}`,
    cartWeld: (text, font, material, colour) => `Надпись целым словом «${text}», ${font}, ${material}, ${colour}`,
    cartStencil: (text, font) => `Своя надпись «${text}», ${font}`,
    stencilPreview: (w, h) => `Превью трафарета ${w}×${h} см`,
    piecePreview: (w, h) => `Превью изделия ${w}×${h} см`,
    joining: "Соединение букв",
    density: ["Слегка касаются", "Плотно", "Очень плотно"],
    baseline: "Планка под словом",
    outline: "Обводка вокруг",
    skewers: "Шпажки:",
    skewerCounts: ["без шпажек", "одна", "две"],
    skewerLength: "Длина шпажки, см",
    weldNote: "Точки над «і», «ї», «й» и отдельные слова соединяем перемычками автоматически, изделие получается одной деталью.",
    canvasTitle: "Свободное полотно",
    canvasLead: "Расставьте надписи и фигуры на одном трафарете. Перемычки ставим сами, проблемные места подсвечиваем.",
    canvasRegion: "Полотно",
    canvasLabel: (w, h) => `Полотно трафарета ${w}×${h} см`,
    canvasLoading: "Загрузка полотна…",
    shapes: { circle: "Круг", rect: "Прямоугольник", star: "Звезда", heart: "Сердце", frame: "Рамка" },
    shapeFallback: "фигура",
    canvasModes: {
      stencil: { title: "Трафарет", hint: "Элементы вырезаются из листа, перемычки ставим сами" },
      piece: { title: "Целым куском", hint: "Элементы становятся одной деталью из акрила: топпер, надпись, вывеска" },
    },
    autoJoin: "Соединить автоматически: короткие прямые перемычки между частями",
    addText: "Добавить надпись",
    textLabel: "Текст надписи",
    add: "Добавить",
    addShape: "Добавить фигуру",
    sheet: "Лист",
    gridMm: "Сетка, мм",
    marginMm: "Отступ от края, мм",
    snap: "Прилипать к сетке",
    showGrid: "Показывать сетку",
    copy: "Копия",
    lock: "Закрепить",
    unlock: "Разблокировать",
    delete: "Удалить",
    undo: "↶ Отменить",
    redo: "↷ Повторить",
    canvasFooter: (w, h, grid) => `${w} × ${h} см · сетка ${grid} мм · `,
    checking: "проверяем…",
    bridgeCount: (n) => `перемычек ${n}`,
    canvasDefaultText: "Кофе",
    canvasCheckFailed: "Не удалось проверить макет. Обновите страницу.",
    canvasTextFailed: "Не удалось подготовить текст этим шрифтом. Выберите другой шрифт.",
    cartCanvasPiece: (names) => `Изделие целым куском с полотна: ${names}`,
    cartCanvasStencil: (names) => `Трафарет с полотна: ${names}`,
  },
};
