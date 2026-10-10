/** Налаштування бота, зібрані зі змінних оточення (файл .env поруч із ботом). */
export interface BotConfig {
  /** Токен від @BotFather. Лише зі змінної TELEGRAM_BOT_TOKEN, ніколи з коду чи чату. */
  telegramToken: string
  /** Telegram ID, яким бот відповідає. Порожній список = бот лише підказує ID на /start. */
  allowedTelegramIds: ReadonlySet<number>
  /** Папка черги заявок: factory\inbox на ноутбуці. */
  inboxDir: string
  /** Папка з data/categories.json і data/materials.json (за замовчуванням — папка бота). */
  catalogDir: string
  /** Файл стану бота (чернетки, що збираються, і вже надіслані сповіщення). */
  stateFile: string
  /** Адреса бекенда Medusa, наприклад http://localhost:9000. */
  medusaBackendUrl: string
  /** Секретний ключ Medusa (Settings → Secret API Keys). Порожній = кнопка публікації вимкнена. */
  medusaAdminApiKey: string
  /** Як часто перевіряти status.json заявок, секунд. */
  statusPollSeconds: number
  /** Найбільший файл, який бот приймає (Bot API віддає до 20 МБ). */
  maxFileBytes: number
}
