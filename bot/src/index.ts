import path from "node:path"
import { config as loadDotenv } from "dotenv"
import { Bot, GrammyError, HttpError } from "grammy"
import { accessGuard } from "./handlers/access"
import { registerCallbacks } from "./handlers/callbacks"
import { registerCommands } from "./handlers/commands"
import { registerMediaHandlers } from "./handlers/media"
import { registerTextHandler } from "./handlers/text"
import { loadCatalog } from "./lib/catalog"
import { loadConfig } from "./lib/config"
import { Inbox } from "./lib/inbox"
import { MedusaAdmin } from "./lib/medusa"
import { StateStore } from "./lib/state-store"
import { StatusWatcher } from "./lib/status-watcher"
import { UserLock } from "./lib/user-lock"
import type { BotDeps } from "./types/deps"

async function main(): Promise<void> {
  loadDotenv({ path: path.resolve(__dirname, "..", "..", ".env") })
  const config = loadConfig()

  const inbox = new Inbox(config.inboxDir)
  await inbox.ensure()
  const store = new StateStore(config.stateFile)
  await store.load()

  const deps: BotDeps = {
    config,
    catalog: await loadCatalog(config.catalogDir),
    store,
    inbox,
    medusa: new MedusaAdmin(config.medusaBackendUrl, config.medusaAdminApiKey),
    lock: new UserLock(),
  }

  const bot = new Bot(config.telegramToken)
  bot.use(accessGuard(deps))
  registerCommands(bot, deps)
  registerMediaHandlers(bot, deps)
  registerTextHandler(bot, deps)
  registerCallbacks(bot, deps)

  bot.catch(async (err) => {
    const { ctx, error } = err
    if (error instanceof GrammyError) console.error(`[bot] помилка Telegram: ${error.description}`)
    else if (error instanceof HttpError) console.error("[bot] немає зв'язку з Telegram:", error.error)
    else console.error("[bot] помилка:", error)
    await ctx.reply("Сталася помилка, дію не виконано. Спробуйте ще раз або надішліть /card.").catch(() => undefined)
  })

  await bot.api.setMyCommands([
    { command: "help", description: "Як додати товар" },
    { command: "status", description: "Стан останніх заявок" },
    { command: "card", description: "Показати поточну картку" },
    { command: "cancel", description: "Скасувати поточну заявку" },
    { command: "id", description: "Мій Telegram ID" },
  ])

  const watcher = new StatusWatcher(bot.api, deps)

  const shutdown = (signal: string): void => {
    console.log(`[bot] зупинка (${signal})`)
    watcher.stop()
    void bot.stop()
  }
  process.once("SIGINT", () => shutdown("SIGINT"))
  process.once("SIGTERM", () => shutdown("SIGTERM"))

  console.log(`[bot] черга заявок: ${config.inboxDir}`)
  console.log(`[bot] дозволені Telegram ID: ${[...config.allowedTelegramIds].join(", ") || "немає (лише /start)"}`)
  console.log(`[bot] публікація в Medusa: ${deps.medusa.enabled ? config.medusaBackendUrl : "вимкнена (немає ключа)"}`)

  watcher.start()
  await bot.start({
    allowed_updates: ["message", "callback_query"],
    onStart: (me) => console.log(`[bot] @${me.username} працює. Зупинити: Ctrl+C`),
  })
}

main().catch((error: unknown) => {
  console.error(`[bot] не вдалося запустити: ${(error as Error).message}`)
  process.exit(1)
})
