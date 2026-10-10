import type { Context, NextFunction } from "grammy"
import type { BotDeps } from "../types/deps"

/**
 * Бот відповідає лише Telegram ID зі списку ALLOWED_TELEGRAM_IDS.
 * Чужим на /start він каже їхній ID (щоб Денис міг додати помічника), на решту мовчить.
 */
export function accessGuard(deps: BotDeps) {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const userId = ctx.from?.id
    if (userId === undefined) return
    if (ctx.chat && ctx.chat.type !== "private") return
    if (deps.config.allowedTelegramIds.has(userId)) {
      await next()
      return
    }
    const text = ctx.message?.text ?? ""
    if (text.startsWith("/start") || text.startsWith("/id")) {
      const intro =
        deps.config.allowedTelegramIds.size === 0
          ? "Бот ще не налаштований: немає жодного дозволеного користувача."
          : "У вас немає доступу до цього бота."
      await ctx.reply(
        `${intro}\n\nВаш Telegram ID: <code>${userId}</code>\n` +
          "Щоб отримати доступ, цей ID треба вписати в ALLOWED_TELEGRAM_IDS у файлі .env бота і перезапустити бота.",
        { parse_mode: "HTML" },
      )
    }
    console.warn(`[access] повідомлення від стороннього користувача ${userId} проігноровано`)
  }
}
